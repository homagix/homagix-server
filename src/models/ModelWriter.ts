import { DishList } from "./dishList"
import fs from "fs"
import path from "path"
import YAML from "yaml"
import { Dish } from "./dish"
import { getIngredientById, Ingredient } from "./ingredient"
import { User } from "./user"

export type WriterFunction = (...args: unknown[]) => void

export type ModelWriter = {
  writeDish(dish: Dish): void
  writeIngredient(ingredient: Ingredient): void
  writeUser(user: User): void
  removeUser(id: string): void
  writeDishlist(list: DishList): void
  writeDishHistory(listId: string, list: Record<string, string>): void
}

export default function ModelWriterFactory(basePath: string): ModelWriter {
  function writer(name: string) {
    const base = path.join(basePath, name)
    fs.mkdirSync(base, { recursive: true })
    return (id: string, data: unknown) => {
      const filePath = path.join(base, id + ".yaml")
      if (data) {
        fs.writeFileSync(filePath, "---\n" + YAML.stringify(data))
      } else {
        fs.unlinkSync(filePath)
      }
    }
  }

  const dishesWriter = writer("dishes")
  const ingredientsWriter = writer("ingredients")
  const usersWriter = writer("users")
  const dishListWriter = writer("dishLists")
  const dishHistoryWriter = writer("dishHistory")

  return {
    writeDish(dish: Dish): void {
      const data = Object.assign({}, dish, {
        items:
          dish.items &&
          dish.items.map(ingredient => {
            const item = getIngredientById(ingredient.id)
            if (!item) {
              throw Error("Ingredient not found: " + JSON.stringify(ingredient))
            }
            return `${ingredient.amount} ${item.unit} ${item.name}`
          }),
      })
      dishesWriter(dish.id as string, { ...data, id: undefined })
    },

    writeIngredient: (ingredient: Ingredient) =>
      ingredientsWriter(ingredient.id as string, ingredient),
    writeUser: (user: User) => usersWriter(user.id, user),
    removeUser: (id: string) => usersWriter(id, null),
    writeDishlist: (list: DishList) => dishListWriter(list.id, list),
    writeDishHistory: (listId: string, list: Record<string, string>) =>
      dishHistoryWriter(listId, list),
  }
}
