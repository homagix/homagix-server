import expect from "expect"
import Controller from "./DishController"
import DishReader from "./DishReader"
import Store from "../EventStore/Store.mock"
import Models from "../models/MockedModel"
import { testUser } from "../auth/MockAuth"
import { User } from "../models/user"
import {
  bunIngredient,
  pattyIngredient,
  bunItem,
  pattyItem,
  createIngredients,
  createDish,
  burger,
  patty,
} from "./testData"

type Item = {
  id: string
  amount: number
}

const store = Store()
const models = Models({ store })
const dishReader = DishReader({ store, models })
const dishController = Controller({ store, models, dishReader })

describe("DishController", () => {
  beforeEach(() => {
    models.dish.reset()
    models.dishList.reset()
  })

  it("should add new items to a dish", async () => {
    await createIngredients(store, models, [bunIngredient, pattyIngredient])
    await createDish(store, models, { ...burger, items: [bunItem] })

    const result = await dishController.addItem(
      burger.id,
      patty,
      testUser as User
    )

    expect(result.items).toEqual([bunItem, pattyItem])
    const items = models.dish.byId(burger.id).items as Item[]
    expect(items).toEqual([bunItem, pattyItem])
  })

  it("should remove items from a dish", async () => {
    await createIngredients(store, models, [bunIngredient, pattyIngredient])
    await createDish(store, models, burger)

    const result = await dishController.removeItem(
      burger.id,
      bunItem.id,
      testUser as User
    )

    expect(result.items).toContain(pattyItem)
    const items = models.dish.byId(burger.id).items as Item[]
    expect(items).toContain(pattyItem)
  })

  it("should update the amount of an item of a dish", async () => {
    await createIngredients(store, models, [bunIngredient])
    await createDish(store, models, { ...burger, items: [bunItem] })

    const result = await dishController.updateItemAmount(
      burger.id,
      bunItem.id,
      2,
      testUser as User
    )

    expect(result.items).toEqual([{ id: bunItem.id, amount: 2 }])
    const items = models.dish.byId(burger.id).items as Item[]
    expect(items).toEqual([{ id: bunItem.id, amount: 2 }])
  })
})
