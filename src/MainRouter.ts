import express, { Request, RequestHandler, Response, Router } from "express"
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

export function jsonResult(func: RouteHandler): RequestHandler {
  const fn = {
    async [func.name](req: Request, res: Response) {
      try {
        const result = await func(req)
        res.json(result)
      } catch (error) {
        console.error(error)
        res.status(500).json({ error })
      }
    },
  }
  return fn[func.name]
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
  const dishRouter = DishRouter({ jsonResult, auth, dishController })
  const ingredientRouter = IngredientRouter({
    controller: IngredientController({ models, store }),
    jsonResult,
  })
  const weekplanRouter = WeekplanRouter({
    controller: WeekplanController({ models, store, proposer }),
    jsonResult,
    auth,
  })

  router.use("/sessions", sessionRouter)
  router.use("/accounts", accountRouter)
  router.use("/dishes", dishRouter)
  router.use("/ingredients", ingredientRouter)
  router.use("/weekplan", weekplanRouter)

  return router
}
