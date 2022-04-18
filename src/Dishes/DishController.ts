import { randomUUID } from "crypto"
import { Store } from "../EventStore/EventStore"
import { Models } from "../models"
import { Dish } from "../models/dish"
import { User } from "../models/user"
import { DishReader, ReadableItem } from "./DishReader"

type WritableDish = {
  name: string
  recipe: string
  source: string
  items: ReadableItem[]
  isFavorite?: boolean
}

export type AnnotatedDish = Dish & {
  isFavorite?: boolean
  isEditable?: boolean
}
export type DishController = ReturnType<typeof Factory>
type IDishController = {
  store: Store
  models: Models
  dishReader: DishReader
}

export default function Factory(dependencies: IDishController) {
  const { store, models, dishReader } = dependencies
  const { dishAdded, dishModified, itemRemoved, itemAmountUpdated } =
    models.dish.events
  const { addDishToList, removeDishFromList } = models.dishList.events

  function getFavorites(user?: User) {
    return (user && models.dishList.getById(user.listId || user.id)) || []
  }

  function annotate(dish: Dish, user: User) {
    const favorites = getFavorites(user)
    return {
      ...dish,
      isFavorite: favorites.includes(dish.id),
      isEditable: canEdit(user, dish.id),
    }
  }

  function getSingleDish(dishId: string, user: User): AnnotatedDish {
    return annotate(models.dish.byId(dishId), user)
  }

  function canEdit(user: User, dishId: string): boolean {
    const dish = models.dish.byId(dishId)
    const isOwner = [user.listId, user.id].includes(dish.ownedBy)
    return dish && (user.isAdmin || isOwner)
  }

  return {
    getAll(user?: User): AnnotatedDish[] {
      const dishes = models.dish.getAll()
      if (user) {
        return dishes.map(dish => annotate(dish, user))
      } else {
        return dishes
      }
    },

    async addDish(data: WritableDish, user: User) {
      const dishId = randomUUID()
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
      return getSingleDish(dishId, user)
    },

    async updateDish(id: string, dish: Partial<WritableDish>, user: User) {
      const { name, recipe, source, isFavorite } = dish
      await store.dispatch(
        dishModified(JSON.parse(JSON.stringify({ id, name, recipe, source })))
      )
      if (isFavorite !== undefined) {
        const event = isFavorite ? addDishToList : removeDishFromList
        await store.dispatch(event(id, user.listId || user.id))
      }
      return getSingleDish(id, user)
    },

    canEdit,

    async addItem(dishId: string, item: ReadableItem, user: User) {
      await dishReader.addItem(dishId, item)
      return getSingleDish(dishId, user)
    },

    async removeItem(dishId: string, itemId: string, user: User) {
      await store.dispatch(itemRemoved(dishId, itemId))
      return getSingleDish(dishId, user)
    },

    async updateItemAmount(
      dishId: string,
      itemId: string,
      amount: number,
      user: User
    ) {
      await store.dispatch(itemAmountUpdated(dishId, itemId, amount))
      return getSingleDish(dishId, user)
    },
  }
}
