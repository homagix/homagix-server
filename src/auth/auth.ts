import passport from "passport"
import LoginStrategy from "./LoginStrategy"
import AccessCodeStrategy from "./AccessCodeStrategy"
import { Strategy as JwtStrategy } from "passport-jwt"
import session from "express-session"
import bcrypt from "bcryptjs"
import jsonwebtoken from "jsonwebtoken"
import { randomUUID } from "crypto"
import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from "express"
import { Store } from "../EventStore/EventStore"
import { Models } from "../models"
import { User } from "../models/user"

export type DoneFunction = (error: string | null, user: User | false) => void
export type AuthUser = User & {
  accessCode?: string
  password?: string
  token?: string
}
export type MiddleWare = (options?: Record<string, unknown>) => RequestHandler

export interface IUserRequest extends Request {
  user: AuthUser
}

type NewUser = {
  firstName: string
  email: string
  password: string
}

export type Auth = ReturnType<typeof Factory>

export default function Factory({
  app,
  models,
  store,
  secretOrKey,
}: {
  app: Router
  models: Models
  store: Store
  secretOrKey: string
}) {
  const { userAdded, userChanged } = models.user.events
  app.use(
    session({ secret: secretOrKey, resave: true, saveUninitialized: true })
  )

  function login(user: AuthUser, req: Request, res: Response) {
    const roles = [] as string[]
    if (user.isAdmin) {
      roles.push("admin")
    }
    user.token = jsonwebtoken.sign(
      {
        sub: user.id,
        firstName: user.firstName,
        roles,
      },
      secretOrKey,
      { expiresIn: "24h" }
    )
    res.cookie("token", user.token, { maxAge: 24 * 60 * 60 * 1000 })
    req.user = user
  }

  function register(newUser: NewUser, req: Request, res: Response): User {
    const user = {
      ...newUser,
      id: randomUUID(),
      accessCode: randomUUID(),
      password: newUser.password && bcrypt.hashSync(newUser.password, 10),
    }
    store.dispatch(userAdded(user))
    login(user, req, res)
    return user
  }

  function logout(res: Response): void {
    res.cookie("token", "", { maxAge: -1 })
  }

  function generateAccessCode(user: AuthUser): void {
    user.accessCode = randomUUID()
    store.dispatch(userChanged(user.id, user))
  }

  function resetAccessCode(user: AuthUser): void {
    user.accessCode = ""
    store.dispatch(userChanged(user.id, user))
  }

  function jwtFromRequest(req: Request) {
    if (req.cookies && req.cookies.token) {
      return req.cookies.token
    }
    if (req.headers.authorization) {
      const parts = req.headers.authorization.split(" ")
      if (parts.length === 2 && parts[0] === "Bearer") {
        return parts[1]
      }
    }
    return ""
  }

  function setPassword(user: AuthUser, newPassword: string): void {
    user.password = bcrypt.hashSync(newPassword, 10)
    user.accessCode = ""
    store.dispatch(userChanged(user.id, user))
  }

  passport.use(new LoginStrategy(models.user))
  passport.use(new AccessCodeStrategy(models.user))

  passport.use(
    new JwtStrategy(
      { jwtFromRequest, secretOrKey },
      (payload: { sub: string }, done: DoneFunction) => {
        try {
          const user = models.user.getById(payload.sub)
          done(null, user)
        } catch (error) {
          done((error as Error).toString(), false)
        }
      }
    )
  )

  function authenticate(
    type: string | string[],
    options = {} as { allowAnonymous?: boolean }
  ): RequestHandler {
    return function (req: Request, res: Response, next: NextFunction): void {
      passport.authenticate(type, { session: false }, (err, user) => {
        if (err) {
          return next(err)
        } else if (!req.user && !user && !options.allowAnonymous) {
          res.status(401).json({ error: "Not authenticated" })
        } else if (!req.user && user) {
          login(user, req, res)
          next()
        } else {
          next()
        }
      })(req, res, next)
    }
  }

  app.use(passport.initialize())
  app.use(passport.session())

  const requireCode = (options = {}) => authenticate("access_code", options)
  const checkJWT = (options = {}) =>
    authenticate("jwt", { ...options, allowAnonymous: true })
  const requireJWT = (options = {}) => authenticate("jwt", options)
  const requireLogin = (options = {}) => authenticate("login", options)

  function requireAuth() {
    return (req: Request, res: Response, next: NextFunction) =>
      req.user ? next() : next({ status: 401, message: "Not authenticated" })
  }

  function requireAdmin() {
    return function (req: Request, res: Response, next: NextFunction) {
      if (
        (!req.user || !(req.user as { isAdmin: boolean }).isAdmin) &&
        models.user.adminIsDefined
      ) {
        next({ status: 403, message: "Not allowed" })
      } else {
        next()
      }
    }
  }

  return {
    authenticate,
    register,
    setPassword,
    login,
    logout,
    generateAccessCode,
    resetAccessCode,

    requireCode,
    requireJWT,
    checkJWT,
    requireLogin,
    requireAuth,
    requireAdmin,
  }
}
