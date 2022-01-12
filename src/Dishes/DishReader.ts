import fs from "fs"
import path from "path"
import YAML from "yaml"
import { randomUUID } from "crypto"
import units from "../models/units"
import { Store } from "../EventStore/EventStore"
import { Models } from "../models"

export type ReadableItem = {
  amount: number
  unit: string
  name: string
}

export interface DishReader {
  loadData(basePath: string): Promise<void>
  addItem(dishId: string, item: ReadableItem): Promise<void>
}

export default function ({
  store,
  models,
}: {
  store: Store
  models: Models
}): DishReader {
  const { dishAdded, ingredientAssigned } = models.dish.events
  const { ingredientAdded } = models.ingredient.events

  function extractItemProperties(itemString: string): ReadableItem {
    const matches = itemString.match(/^\s*([\d.,]*)\s*(\w+)\.?\s*(.*)$/)
    const amount = (matches ? +matches[1] : 1) || 1
    const hasUnit = matches && units.map(u => u.name).includes(matches[2])
    const unit = hasUnit && matches ? matches[2] : "Stk"
    const name =
      hasUnit && matches
        ? matches[3]
        : (matches && matches[2] + " " + matches[3]) || ""
    return { amount, unit, name }
  }

  async function addItem(
    dishId: string,
    item: ReadableItem,
    dispatchter = store.dispatch.bind(store)
  ) {
    const existing = models.ingredient.byExample(item, true)
    if (existing && existing.id) {
      await dispatchter(ingredientAssigned(dishId, existing.id, item.amount))
    } else {
      const id = randomUUID()
      await dispatchter(
        ingredientAdded({
          id,
          name: item.name,
          unit: item.unit,
          group: "other",
        })
      )
      await dispatchter(ingredientAssigned(dishId, id, item.amount))
    }
  }

  function loadIngredients(basePath: string) {
    const dir = path.resolve(basePath, "ingredients")
    if (!fs.existsSync(dir)) {
      return
    }
    fs.readdirSync(dir).map(file => {
      const content = fs
        .readFileSync(path.resolve(basePath, "ingredients", file))
        .toString()
      const ingredient = YAML.parse(content)
      ingredient.id = file.replace(/\.\w+$/, "")
      store.dispatch(ingredientAdded(ingredient))
    })
  }

  async function loadDishes(basePath: string) {
    const dir = path.resolve(basePath, "dishes")
    if (!fs.existsSync(dir)) {
      return
    }
    await Promise.all(
      fs.readdirSync(dir).map(async file => {
        const content = fs
          .readFileSync(path.resolve(basePath, "dishes", file))
          .toString()
        const dish = YAML.parse(content)
        dish.id = file.replace(/\.\w+$/, "")
        const items = dish.items as string[]
        delete dish.items
        store.dispatch(dishAdded(dish))
        if (items && items.map) {
          await Promise.all(
            items
              .map(extractItemProperties)
              .map(item => addItem(dish.id, item, store.dispatch.bind(store)))
          )
        }
      })
    )
  }

  return {
    async loadData(basePath: string) {
      loadIngredients(basePath)
      loadDishes(basePath)
    },
    addItem,
  }
}
