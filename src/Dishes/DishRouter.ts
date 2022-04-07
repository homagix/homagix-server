import express, { Request } from "express"
import { HTTPError } from "./../lib/HTTPError"
import { User } from "../models/user"
import { DishController } from "./DishController"
import { assert, assertOneOf, isLoggedIn, JSONHandler } from "../MainRouter"
import { Dish } from "../models/dish"
import { ReadableItem } from "./DishReader"

type Dependencies = {
  jsonResult: JSONHandler
  dishController: DishController
}

export default function ({ jsonResult, dishController }: Dependencies) {
  const router = express.Router()

  function canEdit(req: Request) {
    if (!dishController.canEdit(req.user as User, req.params.id)) {
      return new HTTPError(403, "Not allowed to update a foreign dish")
    }
  }

  function isOnlyFavoriteField(req: Request) {
    const fieldsToChange = Object.keys(req.body)
    if (fieldsToChange.length !== 1 || fieldsToChange[0] !== "isFavorite") {
      return new HTTPError(
        403,
        "Not allowed change fields other than 'isFavorite'"
      )
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

  router.get("/", jsonResult(getAllDishes))
  router.post("/", assert(isLoggedIn), jsonResult(addDish))
  router.patch(
    "/:id",
    assert(isLoggedIn),
    assertOneOf([canEdit, isOnlyFavoriteField]),
    jsonResult(updateDish)
  )

  router.post(
    "/:id/items",
    assert(isLoggedIn),
    assert(canEdit),
    jsonResult(addItem)
  )
  router.patch(
    "/:id/items/:itemId",
    assert(isLoggedIn),
    assert(canEdit),
    jsonResult(updateItem)
  )
  router.delete(
    "/:id/items/:itemId",
    assert(isLoggedIn),
    assert(canEdit),
    jsonResult(removeItem)
  )

  return router
}
