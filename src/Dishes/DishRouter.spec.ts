import { beforeEach, describe, expect, it } from "vitest"
import express, { Request, Response } from "express"
import request from "supertest"
import Controller from "./DishController"
import Router from "./DishRouter"
import DishReader from "./DishReader"
import Store from "../EventStore/Store.mock"
import Models from "../models/MockedModel"
import auth, { validToken, adminToken, testUser } from "../auth/MockAuth"
import { RouteHandler } from "../MainRouter"
import {
  bun,
  patty,
  bunIngredient,
  pattyIngredient,
  bunItem,
  pattyItem,
  createIngredients,
  createDish,
  burger,
} from "./testData"
import { Dish } from "../models/dish"
import { User } from "../models/user"

const store = Store()
const models = Models({ store })
const jsonResult =
  (func: RouteHandler) => async (req: Request, res: Response) =>
    res.json(await func(req))
const dishReader = DishReader({ store, models })
const dishController = Controller({ store, models, dishReader })
const router = Router({ jsonResult, dishController })
const app = express()
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(auth.checkJWT())
app.use(router)

async function createPancake(options: Partial<Dish> = {}) {
  await store.dispatch(
    models.dish.events.dishAdded({
      id: "4711",
      name: "Pancake",
      items: [],
      ...options,
    })
  )
}

function mapItem(ingredient: { id: string; amount: number }) {
  const i = models.ingredient.byId(ingredient.id)
  return {
    name: i?.name,
    unit: i?.unit,
    amount: ingredient.amount,
  }
}

describe("DishRouter", () => {
  beforeEach(() => {
    models.dish.reset()
    models.dishList.reset()
  })

  describe("GET /dishes", () => {
    it("should return a json list of dishes", async () => {
      const result = await request(app).get("/").expect(200)

      expect(result.body).not.toHaveProperty("error")
      expect(result.body).toHaveProperty("dishes")
    })

    it("should mark favorites in list", async () => {
      await createPancake()
      store.dispatch(models.dishList.events.addDishToList("4711", "007"))
      const result = await request(app)
        .get("/")
        .set("Authorization", "Bearer " + validToken)
        .expect(200)

      expect(result.body.dishes).toEqual([
        {
          id: "4711",
          name: "Pancake",
          items: [],
          isFavorite: true,
          isEditable: false,
        },
      ])
    })

    it("should not return information about favorites if not authenticated", async () => {
      await createPancake()
      store.dispatch(models.dishList.events.addDishToList("4711", "42"))
      const result = await request(app).get("/").expect(200)

      expect(result.body.dishes.shift()).not.toHaveProperty("isFavorite")
    })
  })

  describe("POST /dishes", () => {
    it("should not allow to create dishes when not authenticated", async () => {
      const result = await request(app)
        .post("/")
        .send({ name: "Hamburger" })
        .expect(401)

      expect(result.body).toHaveProperty("error")
    })

    it("should add a dish", async () => {
      const items = [bun, patty]
      const result = await request(app)
        .post("/")
        .set("Authorization", "Bearer " + validToken)
        .send({ name: "Hamburger", items })
        .expect(200)

      expect(result.body.id).not.toEqual("")
      expect(result.body.name).toEqual("Hamburger")
      const saved = models.dish.byId(result.body.id)
      expect(saved).toHaveProperty("name", "Hamburger")
      expect(saved).toHaveProperty("items")
      expect(saved.items).toBeInstanceOf(Array)
      const savedItems = saved.items.map(mapItem)
      expect(savedItems).toContainEqual(items[0])
      expect(savedItems).toContainEqual(items[1])
    })

    it(`should save the current user's listId as the owner of a new dish`, async () => {
      const result = await request(app)
        .post("/")
        .set("Authorization", "Bearer " + validToken)
        .send({ name: "Hamburger" })
        .expect(200)

      const saved = models.dish.byId(result.body.id)
      expect(saved.ownedBy).not.toBeUndefined()
      expect(saved.ownedBy).toBe("007")
    })
  })

  describe("PATCH /dishes/:id", () => {
    it("should not allow to set favorites if not authenticated", async () => {
      await request(app).patch("/4711").send({ isFavorite: true }).expect(401)
    })

    it("should mark dishes as favorite for authenticated users", async () => {
      await createPancake({ ownedBy: "007" })
      await request(app)
        .patch("/4711")
        .set("Authorization", "Bearer " + validToken)
        .send({ isFavorite: true })
        .expect(200)

      expect(models.dishList.getById("007")).toEqual(["4711"])
    })

    it("should return the dish when it was marked as favorite", async () => {
      await createPancake({ ownedBy: "007" })
      const result = await request(app)
        .patch("/4711")
        .set("Authorization", "Bearer " + validToken)
        .send({ isFavorite: true })
        .expect(200)

      expect(result.body).toHaveProperty("isFavorite")
      expect(result.body.isFavorite).toBe(true)
    })

    it("should remove favorite mark from dish", async () => {
      await createPancake({ ownedBy: "007" })
      store.dispatch(models.dishList.events.addDishToList("4711", "007"))
      await request(app)
        .patch("/4711")
        .set("Authorization", "Bearer " + validToken)
        .send({ isFavorite: false })
        .expect(200)

      expect(models.dishList.getById("007")).toEqual([])
    })

    it("should return the dish when the favorite mark was removed", async () => {
      await createPancake({ ownedBy: "007" })
      store.dispatch(models.dishList.events.addDishToList("4711", "006"))
      const result = await request(app)
        .patch("/4711")
        .set("Authorization", "Bearer " + validToken)
        .send({ isFavorite: false })
        .expect(200)

      expect(result.body).not.toHaveProperty("error")
      expect(result.body).toHaveProperty("isFavorite", false)
    })

    it("should update the title of a dish", async () => {
      await createPancake({ ownedBy: "007" })
      const result = await request(app)
        .patch("/4711")
        .set("Authorization", "Bearer " + validToken)
        .send({ name: "Hamburger" })
        .expect(200)

      expect(result.body.id).toBe("4711")
      expect(result.body.name).toBe("Hamburger")
      expect(models.dish.byId("4711").name).toBe("Hamburger")
    })

    it("should update the recipe of a dish", async () => {
      await createPancake({ ownedBy: "007" })
      const result = await request(app)
        .patch("/4711")
        .set("Authorization", "Bearer " + validToken)
        .send({ recipe: "Place the patty in the bun" })
        .expect(200)

      expect(result.body.id).toBe("4711")
      expect(result.body.name).toBe("Pancake")
      expect(result.body.recipe).toBe("Place the patty in the bun")
      const savedDish = models.dish.byId("4711")
      expect(savedDish.name).toBe("Pancake")
      expect(savedDish.recipe).toBe("Place the patty in the bun")
    })

    it("should ignore unknown properties of a dish", async () => {
      await createPancake({ ownedBy: "007" })
      await request(app)
        .patch("/4711")
        .set("Authorization", "Bearer " + validToken)
        .send({ unknown: "value" })
        .expect(200)

      expect(models.dish.byId("4711")).not.toHaveProperty("unknown")
    })

    it("should not allow to update dishes if not authenticated", async () => {
      const result = await request(app)
        .patch("/4711")
        .send({ name: "Hamburger" })
        .expect(401)

      expect(result.body).toHaveProperty("error")
    })

    it("should not allow to update dishes if not owner", async () => {
      await createPancake({ ownedBy: "0815" })
      const result = await request(app)
        .patch("/4711")
        .set("Authorization", "Bearer " + validToken)
        .send({ name: "Hamburger" })
        .expect(403)

      expect(result.body).toHaveProperty("error")
    })

    it("should not allow to update dishes without owner", async () => {
      await createPancake()
      const result = await request(app)
        .patch("/4711")
        .set("Authorization", "Bearer " + validToken)
        .send({ name: "Hamburger" })
        .expect(403)

      expect(result.body).toHaveProperty("error")
    })

    it("should allow admins to update dishes without owner", async () => {
      await createPancake()
      const result = await request(app)
        .patch("/4711")
        .set("Authorization", "Bearer " + adminToken)
        .send({ name: "Hamburger" })
        .expect(200)

      expect(result.body.name).toBe("Hamburger")
      expect(models.dish.byId("4711").name).toBe("Hamburger")
    })

    it.todo("should update the image of a dish")
  })

  describe("POST /dishes/:dishId/items", () => {
    it("should add items to a dish", async () => {
      await createIngredients(store, models, [bunIngredient, pattyIngredient])
      await createDish(store, models, { ...burger, items: [bunItem] })
      const result = await request(app)
        .post("/4711/items")
        .set("Authorization", "Bearer " + validToken)
        .send(patty)
        .expect(200)

      const bodyItems = result.body.items.map(mapItem)
      expect(bodyItems).toContainEqual(bun)
      expect(bodyItems).toContainEqual(patty)
    })
  })

  describe("DELETE /dishes/:dishId/items/:itemId", () => {
    it("should remove items from a dish", async () => {
      await createIngredients(store, models, [bunIngredient, pattyIngredient])
      await createDish(store, models, burger)
      let called = false
      dishController.removeItem = async (
        dishId: string,
        itemId: string,
        user: User
      ) => {
        called = true
        expect(itemId).toBe(bunItem.id)
        expect(user.id).toBe(testUser.id)
        return { id: dishId, items: [pattyItem] } as Dish
      }
      const result = await request(app)
        .delete("/4711/items/" + bunItem.id)
        .set("Authorization", "Bearer " + validToken)
        .expect(200)

      expect(result.ok).toBe(true)
      expect(result.body.items).toEqual([pattyItem])
      expect(called).toBe(true)
    })
  })

  describe("PATCH /dishes/:dishId/items/:itemId", () => {
    it("should update the amount of an item of a dish", async () => {
      await createIngredients(store, models, [bunIngredient])
      await createDish(store, models, { ...burger, items: [bunItem] })
      const result = await request(app)
        .patch("/4711/items/" + bunItem.id)
        .set("Authorization", "Bearer " + validToken)
        .send({ amount: 2 })
        .expect(200)

      expect(result.body.items).toEqual([{ id: bunItem.id, amount: 2 }])
    })
  })
})
