import expect from "expect"
import { Models } from "../models"
import { Dish } from "../models/dish"
import { DishProposer } from "./DishProposer"
import WeekplanController from "./WeekplanController"
import Store from "../EventStore/Store.mock"

const store = Store()

const dishes = {
  a: { id: "a" } as Dish,
  b: { id: "b" } as Dish,
  c: { id: "c" } as Dish,
  d: { id: "d" } as Dish,
}
const history = [
  ["2020-12-14", "d"],
  ["2020-12-15", "a"],
  ["2020-12-16", "b"],
  ["2020-12-18", "c"],
  ["2020-12-17", "d"],
  ["2020-12-19", "c"],
  ["2020-12-21", "a"],
  ["2020-12-20", "b"],
  ["2020-12-27", "d"],
]

const dishLists = {
  7: ["a", "b", "c", "d"],
}

const user = { id: "7", firstName: "Luigi", email: "luigi@example.com" }

const models = {
  dishHistory: {
    getFrom: (user, date) => history.filter(([d]) => d >= date),
  },
  dish: {
    byId: id => dishes[id],
  },
  dishList: { getById: listId => dishLists[listId] },
} as Models

const proposer = {
  get(): Dish[] {
    return [dishes.d, dishes.c, dishes.b]
  },
} as DishProposer

const controller = WeekplanController({ models, proposer, store })

describe("WeekplanController.getWeekplan", () => {
  it("should return a list of dishes and dates", () => {
    expect(controller.getWeekplan(user, "2020-12-20", [])).toBeInstanceOf(Array)
  })

  it("should return only dates from the given start date on", () => {
    expect(
      controller
        .getWeekplan(user, "2020-12-20", [])
        .some(e => e.date < "2020-12-20")
    ).toBe(false)
  })

  it("should sort dishes by date", () => {
    expect(
      controller.getWeekplan(user, "2020-12-20", []).map(e => e.date)
    ).toEqual([
      "2020-12-20",
      "2020-12-21",
      "2020-12-22",
      "2020-12-23",
      "2020-12-24",
      "2020-12-25",
      "2020-12-26",
    ])
  })

  it("should contain already served dishes", () => {
    expect(
      controller.getWeekplan(user, "2020-12-20", []).some(e => e.served)
    ).toBe(true)
  })

  it("should contain proposals", () => {
    expect(
      controller.getWeekplan(user, "2020-12-20", []).some(e => !e.served)
    ).toBe(true)
  })

  it("should not return more than 7 entries", () => {
    expect(
      controller.getWeekplan(user, "2020-12-14", []).length
    ).toBeLessThanOrEqual(7)
  })

  it("should keep past days without history entries empty", () => {
    expect(
      controller
        .getWeekplan(user, "2020-12-20", [], new Date("2020-12-24T10:00:00"))
        .map(e => ({ date: e.date, dishId: e.dishId }))
    ).toEqual([
      { date: "2020-12-20", dishId: "b" },
      { date: "2020-12-21", dishId: "a" },
      { date: "2020-12-22", dishId: undefined },
      { date: "2020-12-23", dishId: undefined },
      { date: "2020-12-24", dishId: "d" },
      { date: "2020-12-25", dishId: "c" },
      { date: "2020-12-26", dishId: "b" },
    ])
  })

  it("should include all requested dates", () => {
    expect(
      controller
        .getWeekplan(user, "2020-12-22", [], new Date("2020-12-30T10:00:00"))
        .map(e => e.date)
    ).toEqual([
      "2020-12-22",
      "2020-12-23",
      "2020-12-24",
      "2020-12-25",
      "2020-12-26",
      "2020-12-27",
      "2020-12-28",
    ])
  })
})
