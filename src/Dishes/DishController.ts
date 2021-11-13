import { v4 as uuid } from "uuid"
import { Store } from "../EventStore/EventStore"
import { Models } from "../models"
import { Dish } from "../models/dish"
import { User } from "../models/user"
import { DishReader, ReadableItem } from "./DishReader"

type ReadableDish = {
  name: string
  recipe: string
  source: string
  items: ReadableItem[]
}

export type DishController = {
  getAll(user?: User): Dish[]
  addDish(data: ReadableDish, user: User): Promise<Dish>
  updateDish(id: string, dish: Partial<Dish>, user: User): Promise<Dish>
  setFavorite(user: User, dishId: string, isFavorite: boolean): Promise<Dish>
  canEdit(user: User, dishId: string): boolean
  addItem(dishId: string, item: ReadableItem, user: User): Promise<Dish>
  removeItem(dishId: string, itemId: string, user: User): Promise<Dish>
  updateItemAmount(
    dishId: string,
    itemId: string,
    newAmount: number,
    user: User
  ): Promise<Dish>
}

export default function ({
  store,
  models,
  dishReader,
}: {
  store: Store
  models: Models
  dishReader: DishReader
}): DishController {
  const { dishAdded, dishModified, itemRemoved, itemAmountUpdated } =
    models.dish.events
  const { addDishToList, removeDishFromList } = models.dishList.events

  function getFavorites(user?: User) {
    return (user && models.dishList.getById(user.listId || user.id)) || []
  }

  function getSingleDish(dishId: string, user: User) {
    const favorites = getFavorites(user)
    return {
      ...models.dish.byId(dishId),
      isFavorite: favorites.includes(dishId),
    }
  }

  return {
    getAll(user?: User): Dish[] {
      const dishes = models.dish.getAll()
      if (user) {
        const favorites = getFavorites(user)
        return dishes.map(dish => ({
          ...dish,
          isFavorite: favorites.includes(dish.id),
        }))
      } else {
        return dishes
      }
    },

    async addDish(data: ReadableDish, user: User): Promise<Dish> {
      const dishId = uuid()
      const dish = {
        id: dishId,
        name: data.name,
        recipe: data.recipe,
        source: data.source,
        ownedBy: user.listId || user.id,
        items: [],
      }
      await store.dispatch(dishAdded(dish))
      if (data.items && data.items.forEach) {
        data.items.forEach(item => dishReader.addItem(dishId, item))
      }
      return dish
    },

    async updateDish(
      id: string,
      dish: Partial<Dish>,
      user: User
    ): Promise<Dish> {
      const { name, recipe, source } = dish
      await store.dispatch(
        dishModified(JSON.parse(JSON.stringify({ id, name, recipe, source })))
      )
      return getSingleDish(id, user)
    },

    async setFavorite(
      user: User,
      dishId: string,
      isFavorite: boolean
    ): Promise<Dish> {
      const event = isFavorite ? addDishToList : removeDishFromList
      await store.dispatch(event(dishId, user.listId || user.id))
      return getSingleDish(dishId, user)
    },

    canEdit(user: User, dishId: string): boolean {
      const dish = models.dish.byId(dishId)
      const isOwner = [user.listId, user.id].includes(dish.ownedBy)
      return dish && (user.isAdmin || isOwner)
    },

    async addItem(
      dishId: string,
      item: ReadableItem,
      user: User
    ): Promise<Dish> {
      await dishReader.addItem(dishId, item)
      return getSingleDish(dishId, user)
    },

    async removeItem(
      dishId: string,
      itemId: string,
      user: User
    ): Promise<Dish> {
      await store.dispatch(itemRemoved(dishId, itemId))
      return getSingleDish(dishId, user)
    },

    async updateItemAmount(
      dishId: string,
      itemId: string,
      amount: number,
      user: User
    ): Promise<Dish> {
      await store.dispatch(itemAmountUpdated(dishId, itemId, amount))
      return getSingleDish(dishId, user)
    },
  }
}
