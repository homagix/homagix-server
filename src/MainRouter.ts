import { HTTPError } from "./lib/HTTPError"
import express, {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from "express"
import SessionRouter from "./auth/SessionRouter"
import AccountRouter from "./auth/AccountRouter"
import DishProposer from "./Weekplan/DishProposer"
import DishReader from "./Dishes/DishReader"
import DishController from "./Dishes/DishController"
import DishRouter from "././Dishes/DishRouter"
import IngredientRouter from "./Dishes/IngredientRouter"
import IngredientController from "./Dishes/IngredientController"
import WeekplanController from "./Weekplan/WeekplanController"
import WeekplanRouter from "./Weekplan/WeekplanRouter"
import nodeMailer from "nodemailer"
import Mailer from "./Mailer"
import { Models } from "./models"
import { Store } from "./EventStore/EventStore"
import { Auth } from "./auth/auth"

const mailer = Mailer({ nodeMailer })

export type RouteHandler = (req: Request) => unknown | Promise<unknown>
export type JSONHandler = (func: RouteHandler) => RequestHandler
export type AssertFunc = (req: Request) => HTTPError | undefined

export function jsonResult(func: RouteHandler): RequestHandler {
  const fn = {
    async [func.name](req: Request, res: Response, next: NextFunction) {
      try {
        const result = await func(req)
        res.json(result)
      } catch (error) {
        console.error(error)
        const result =
          error instanceof HTTPError
            ? error
            : new HTTPError(500, (error as Error).message)
        next(result)
      }
    },
  }
  return fn[func.name]
}

export function isLoggedIn(req: Request) {
  if (!req.user) {
    return new HTTPError(401, "You need to be logged in")
  }
}

export function assert(func: AssertFunc) {
  return assertOneOf([func])
}

export function assertOneOf(funcs: AssertFunc[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors = funcs.map(func => func(req)).filter(e => e)
    if (errors.length === funcs.length) {
      res.status(errors[errors.length - 1]?.code || 500).json({ error: errors })
    } else {
      next()
    }
  }
}

export default function ({
  models,
  store,
  auth,
}: {
  models: Models
  store: Store
  auth: Auth
}): Router {
  const router = express.Router()
  const sessionRouter = SessionRouter({ auth })
  const accountRouter = AccountRouter({ auth, store, models, mailer })
  const proposer = DishProposer({ models })
  const dishReader = DishReader({ store, models })
  const dishController = DishController({ store, models, dishReader })
  const dishRouter = DishRouter({ jsonResult, dishController })
  const ingredientRouter = IngredientRouter({
    controller: IngredientController({ models, store }),
    jsonResult,
  })
  const weekplanRouter = WeekplanRouter({
    controller: WeekplanController({ models, store, proposer }),
    jsonResult,
    auth,
  })

  router.use("/session", sessionRouter)
  router.use("/accounts", accountRouter)
  router.use("/dishes", dishRouter)
  router.use("/ingredients", ingredientRouter)
  router.use("/weekplan", weekplanRouter)

  return router
}
