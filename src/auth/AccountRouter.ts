import express, { NextFunction, Request, Response, Router } from "express"
import { Store } from "../EventStore/EventStore"
import { HTTPError } from "../lib/HTTPError"
import { Mailer } from "../Mailer"
import { Models } from "../models"
import { Auth, AuthUser, IUserRequest } from "./auth"

function sendUserInfo(user: AuthUser, res: Response): void {
  const result = { ...(user || {}) }
  delete result.password
  res.json(result)
}

export default ({
  auth,
  models,
  store,
  mailer,
}: {
  auth: Auth
  models: Models
  store: Store
  mailer: Mailer
}): Router => {
  const { invitationAccepted } = models.user.events

  async function registerNewUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (models.user.getByEMail(req.body.email, false)) {
        throw new HTTPError(409, "User already exists")
      }
      const newUser = {
        firstName: req.body.firstName,
        email: req.body.email,
        password: req.body.password,
      }
      const user = auth.register(newUser, req, res)
      if (req.body.inviteFrom) {
        await store.dispatch(invitationAccepted(user, req.body.inviteFrom))
      }
      sendUserInfo((req as IUserRequest).user, res)
    } catch (error) {
      next(error)
    }
  }

  async function sendAccessLink(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = models.user.getByEMail(req.body.email, false)
      if (user) {
        auth.generateAccessCode(user)
        await mailer.send(req.body.email, "LostPasswordMail", { user })
      }
      res.json({})
    } catch (error) {
      next(error)
    }
  }

  function loginWithCode(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as IUserRequest).user
      res.json({ token: user.token })
    } catch (error) {
      next(error)
    }
  }

  function updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as IUserRequest).user
      auth.setPassword(user, req.body.password)
      sendUserInfo(user, res)
    } catch (error) {
      next(error)
    }
  }

  const router = express.Router()
  router.post("/accessLinks", sendAccessLink)
  router.get("/:id/access-codes/:accessCode", auth.requireCode(), loginWithCode)
  router.patch("/:id", auth.requireJWT(), updatePassword)
  router.post("/", registerNewUser)
  return router
}
