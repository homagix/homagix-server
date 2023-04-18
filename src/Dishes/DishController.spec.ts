import { beforeEach, describe, expect, it } from "vitest"
import Controller from "./DishController"
import DishReader from "./DishReader"
import Store from "../EventStore/Store.mock"
import Models from "../models/MockedModel"
import {
  testUser,
  testAdmin,
  testContributor,
  otherUser,
} from "../auth/MockAuth"
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

    const result = await dishController.addItem(burger.id, patty, testUser)

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
      testUser
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
      testUser
    )

    expect(result.items).toEqual([{ id: bunItem.id, amount: 2 }])
    const items = models.dish.byId(burger.id).items as Item[]
    expect(items).toEqual([{ id: bunItem.id, amount: 2 }])
  })

  const editCases = [
    { user: testUser, name: "the owner", expected: true },
    { user: testAdmin, name: "the admin", expected: true },
    { user: testContributor, name: "a contributor", expected: true },
    { user: otherUser, name: "another user", expected: false },
    { user: undefined, name: "an unauthenticated user", expected: undefined },
  ]

  editCases.forEach(({ user, expected, name }) => {
    it(`should return a flag to indicate that the dish can ${
      expected ? "" : "not "
    }be edited by ${name}`, async () => {
      await createIngredients(store, models, [bunIngredient])
      await createDish(store, models, {
        ...burger,
        ownedBy: testUser.listId,
        items: [bunItem],
      })
      const result = dishController.getAll(user)
      expect(result[0].isEditable).toBe(expected)
    })
  })
})
