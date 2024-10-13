import { beforeAll, describe, expect, it } from "vitest"
import express, { Request, Response } from "express"
import request from "supertest"
import Router from "./IngredientRouter"
import Controller from "./IngredientController"
import Store from "../EventStore/Store.mock"
import Models from "../models/MockedModel"
import { RouteHandler } from "../MainRouter"

const store = Store()
const models = Models({ store })
const jsonResult =
  (func: RouteHandler) => async (req: Request, res: Response) => {
    res.json(await func(req))
  }
const controller = Controller({ models, store })
const router = Router({ controller, jsonResult })
const app = express()
app.use(express.json())
app.use(router)

describe("IngredientRouter", () => {
  beforeAll(() => {
    const { dishAdded, ingredientAssigned } = models.dish.events
    const { ingredientAdded } = models.ingredient.events
    models.dish.reset()
    store.dispatch(
      dishAdded({ id: "_", name: "default", alwaysOnList: true, items: [] }),
    )
    store.dispatch(
      ingredientAdded({ id: "1", name: "Milch", unit: "L", group: "cooled" }),
    )
    store.dispatch(ingredientAssigned("_", "1", 3))
  })

  it("should have a route to get all ingredients", async () => {
    const result = await request(app)
      .get("/")
      .expect("Content-Type", /json/)
      .expect(200)

    expect(result.body).toHaveProperty("ingredients")
    expect(result.body.ingredients).toBeInstanceOf(Array)
    expect(result.body).toHaveProperty("standards")
    expect(result.body.standards).toBeInstanceOf(Array)
  })

  it("should return ingredients from the standards list", async () => {
    const result = await request(app).get("/")
    expect(result.body.standards).toEqual([
      { id: "1", name: "Milch", unit: "L", amount: 3, group: "cooled" },
    ])
  })

  it("should add new ingredients", async () => {
    const name = "new ingredient " + +new Date()
    await request(app).post("/").send({ name, unit: "g" })
    expect(models.ingredient.byName(name)).not.toBeUndefined()
  })

  it("should create a uuid when adding new ingredients", async () => {
    const result = await request(app)
      .post("/")
      .send({ name: "new ingredient", unit: "g" })
    expect(result.body.id).toMatch(/^[0-9a-f-]+$/)
  })

  it('should use group "other" for new ingredients', async () => {
    const result = await request(app)
      .post("/")
      .send({ name: "new ingredient " + +new Date(), amount: 100, unit: "g" })
    expect(result.body.group).toEqual("other")
  })
})
