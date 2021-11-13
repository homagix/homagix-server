import { Models } from '../models'
import { Dish } from '../models/dish'
import { User } from '../models/user'

export type DishProposer = {
  get(user: User, inhibited?: string[]): Dish[]
}

export default ({ models }: { models: Models }): DishProposer => {
  return {
    get(user: User, inhibited = []): Dish[] {
      const favorites = models.dishList.getById(user.listId || user.id) || []

      function getDate(dish: Dish): Date {
        return new Date(dish.last || 0)
      }

      function compare(a: Dish, b: Dish) {
        const aIsFav = favorites.includes(a.id)
        const bIsFav = favorites.includes(b.id)
        if (aIsFav && !bIsFav) {
          return -1
        } else if (!aIsFav && bIsFav) {
          return 1
        } else {
          return +getDate(a) - +getDate(b)
        }
      }

      return models.dish
        .getAll()
        .filter(dish => !dish.alwaysOnList)
        .filter(dish => !inhibited.some(id => id === dish.id))
        .sort(compare)
        .slice(0, 7)
    },
  }
}
