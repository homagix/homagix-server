import { Store } from "../EventStore/EventStore"
import { Models } from "../models"
import { User } from "../models/user"
import { DishProposer } from "./DishProposer"

export type WeekPlan = Array<{
  date: string
  dishId: string
  served: boolean
}>

export type WeekplanController = {
  getWeekplan(
    user: User,
    startingAt: string,
    inhibited: string[],
    today?: Date
  ): WeekPlan
  fixPlan(
    user: User,
    date: string,
    accepted: string[]
  ): { accepted: string[]; date: string }
}

export default ({
  models,
  store,
  proposer,
}: {
  models: Models
  store: Store
  proposer: DishProposer
}): WeekplanController => {
  function getWeekplan(
    user: User,
    startingAt: string,
    inhibited: string[],
    today = new Date()
  ): WeekPlan {
    today.setHours(0, 0, 0, 0)
    const history = Object.assign(
      {},
      ...models.dishHistory
        .getFrom(user, startingAt)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(0, 7)
        .map(([date, id]) => ({ [date]: { id } }))
    )
    const proposals = proposer.get(user, inhibited)
    return Array(7)
      .fill(0)
      .map((_, index) => {
        const date = new Date(+new Date(startingAt) + 86400000 * index)
          .toISOString()
          .split("T")[0]
        const dish =
          history[date] || (new Date(date) >= today ? proposals.shift() : {})
        return { date, dishId: dish.id, served: !!history[date] }
      })
  }

  function fixPlan(
    user: User,
    date: string,
    accepted: string[]
  ): { accepted: string[]; date: string } {
    accepted.forEach((id, index) => {
      const newDate = new Date(date)
      newDate.setDate(newDate.getDate() + index)
      store.dispatch(
        models.dish.events.served(id, newDate, user.listId || user.id)
      )
    })
    return { accepted, date }
  }

  return {
    getWeekplan,
    fixPlan,
  }
}
