import expect from "expect"
import fs from "fs"
import path from "path"
import DishReader from "./DishReader"
import MockFS from "../lib/MockFS"
import Store from "../EventStore/Store.mock"
import Models from "../models/MockedModel"
import { Ingredient } from "../models/ingredient"

const store = Store()
const models = Models({ store })
const basePath = path.resolve(__dirname, "testdata")
const mockFS = MockFS({ basePath })

describe("DishReader", () => {
  beforeEach(() => {
    if (fs.existsSync(basePath)) {
      fs.rmSync(basePath, { recursive: true })
    }
    fs.mkdirSync(path.resolve(basePath, "dishes"), { recursive: true })
    store.eventList().length = 0
  })

  afterEach(() => {
    fs.rmSync(basePath, { recursive: true })
  })

  it("should dispatch a new dish", async () => {
    mockFS.setupFiles({
      "dishes/1.yaml": "name: 'test dish'\nitems:\n  - 1 Stk item 1",
    })
    await DishReader({ store, models }).loadData(basePath)
    const addedEvent = store
      .eventList()
      .find(event => event.type === "dishAdded")

    expect(addedEvent).toEqual({
      type: "dishAdded",
      name: "test dish",
      id: "1",
    })
  })

  it("should create new ingredients", async () => {
    mockFS.setupFiles({
      "dishes/1.yaml": "name: 'test dish'\nitems:\n  - 1 Stk new item",
    })
    await DishReader({ store, models }).loadData(basePath)
    const event = store
      .eventList()
      .find(event => event.type === "ingredientAdded")

    expect(event).toHaveProperty("unit", "Stk")
    expect(event).toHaveProperty("name", "new item")
  })

  it("should use existing ingredients", async () => {
    store.dispatch(
      models.ingredient.events.ingredientAdded({
        name: "existing item",
        unit: "g",
      } as Ingredient)
    )
    store.eventList().length = 0
    mockFS.setupFiles({
      "dishes/1.yaml": "name: 'test dish'\nitems:\n  - 500 g existing item",
    })
    await DishReader({ store, models }).loadData(basePath)
    expect(
      store.eventList().find(event => event.type === "ingredientAdded")
    ).toBeUndefined()
  })

  it("should assign all items of a dish", async () => {
    mockFS.setupFiles({
      "dishes/1.yaml":
        "name: 'test dish'\nitems:\n  - 1 Stk new item\n  - 500 g other item",
    })
    await DishReader({ store, models }).loadData(basePath)
    const events = store
      .eventList()
      .filter(event => event.type === "ingredientAssigned")
    expect(events.length).toBe(2)
    expect(events.find(item => item.dishId !== "1")).toBeUndefined()
  })

  it("should create ids for new ingredients", async () => {
    mockFS.setupFiles({
      "dishes/1.yaml": "name: 'test dish'\nitems:\n  - 1 Stk item w/o id",
    })
    await DishReader({ store, models }).loadData(basePath)
    const item = models.ingredient.getAll().pop()
    expect(item?.id).not.toBeUndefined()
    expect(typeof item?.id).toBe("string")
    expect(item?.id).not.toBe("")
  })

  it("should use a unit default", async () => {
    mockFS.setupFiles({
      "dishes/1.yaml": "name: 'test dish'\nitems:\n  - 1 item w/o unit",
    })
    await DishReader({ store, models }).loadData(basePath)
    const item = models.ingredient.getAll().pop()
    expect(item?.unit).toBe("Stk")
  })
})
