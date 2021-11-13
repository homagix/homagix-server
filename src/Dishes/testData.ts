import { testUser } from "../auth/MockAuth"
import { Store } from "../EventStore/EventStore"
import { Models } from "../models"
import { Dish } from "../models/dish"
import { Ingredient } from "../models/ingredient"

export const bun = { amount: 1, unit: "Stk", name: "Bun" }
export const patty = { amount: 1, unit: "Stk", name: "Patty" }
export const bunIngredient = {
  id: "42",
  name: bun.name,
  unit: bun.unit,
  group: "meat",
}
export const pattyIngredient = {
  id: "43",
  name: patty.name,
  unit: patty.unit,
  group: "breakfast",
}
export const bunItem = { id: bunIngredient.id, amount: bun.amount }
export const pattyItem = { id: pattyIngredient.id, amount: patty.amount }

export const burger = {
  id: "4711",
  name: "Pancake",
  items: [bunItem, pattyItem],
  ownedBy: testUser.id,
}

export async function createIngredients(
  store: Store,
  models: Models,
  ingredients: Ingredient[]
): Promise<void> {
  await Promise.all(
    ingredients.map(ingredient => {
      return store.dispatch(
        models.ingredient.events.ingredientAdded(ingredient)
      )
    })
  )
}

export async function createDish(
  store: Store,
  models: Models,
  dish: Dish
): Promise<void> {
  await store.dispatch(models.dish.events.dishAdded(dish))
}
