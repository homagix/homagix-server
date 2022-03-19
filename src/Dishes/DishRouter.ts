import express, { NextFunction, Request, Response, Router } from "express"
import { MiddleWare } from "../auth/auth"
import { User } from "../models/user"
import { DishController } from "./DishController"
import { JSONHandler } from "../MainRouter"
import { Dish } from "../models/dish"
import { ReadableItem } from "./DishReader"

type Auth = { checkJWT: MiddleWare; requireJWT: MiddleWare }
type AssertFunc = (req: Request) => void

export default function ({
  auth,
  jsonResult,
  dishController,
}: {
  auth: Auth
  jsonResult: JSONHandler
  dishController: DishController
}): Router {
  const router = express.Router()
  const { checkJWT, requireJWT } = auth

  function canEdit(req: Request) {
    if (!dishController.canEdit(req.user as User, req.params.id)) {
      throw "Not allowed to update a foreign dish"
    }
  }

  function isOnlyFavoriteField(req: Request) {
    const fieldsToChange = Object.keys(req.body)
    if (fieldsToChange.length !== 1 || fieldsToChange[0] !== "isFavorite") {
      throw "Not allowed change fields other than 'isFavorite'"
    }
  }

  function assert(func: AssertFunc) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        func(req)
        next()
      } catch (error) {
        res.status(403).json({ error })
      }
    }
  }

  function assertOneOf(funcs: AssertFunc[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      let lastError = ""
      if (
        funcs.some(func => {
          try {
            func(req)
            return true
          } catch (error) {
            lastError = error as string
          }
        })
      ) {
        next()
      } else {
        res.status(403).json({ error: lastError })
      }
    }
  }

  function getAllDishes(req: Request) {
    return { dishes: dishController.getAll(req.user as User) }
  }

  async function addDish(req: Request): Promise<Dish> {
    return await dishController.addDish(req.body, req.user as User)
  }

  function updateDish(req: Request) {
    const user = req.user as User & { isFavorite: boolean }
    return dishController.updateDish(req.params.id, req.body, user)
  }

  function addItem(req: Request): Promise<Dish> {
    return dishController.addItem(
      req.params.id,
      req.body as ReadableItem,
      req.user as User
    )
  }

  function updateItem(req: Request): Promise<Dish> {
    return dishController.updateItemAmount(
      req.params.id,
      req.params.itemId,
      req.body.amount,
      req.user as User
    )
  }

  function removeItem(req: Request): Promise<Dish> {
    return dishController.removeItem(
      req.params.id,
      req.params.itemId,
      req.user as User
    )
  }

  router.get("/", checkJWT(), jsonResult(getAllDishes))
  router.post("/", requireJWT(), jsonResult(addDish))
  router.patch(
    "/:id",
    requireJWT(),
    assertOneOf([canEdit, isOnlyFavoriteField]),
    jsonResult(updateDish)
  )

  router.post("/:id/items", requireJWT(), assert(canEdit), jsonResult(addItem))
  router.patch(
    "/:id/items/:itemId",
    requireJWT(),
    assert(canEdit),
    jsonResult(updateItem)
  )
  router.delete(
    "/:id/items/:itemId",
    requireJWT(),
    assert(canEdit),
    jsonResult(removeItem)
  )

  return router
}
