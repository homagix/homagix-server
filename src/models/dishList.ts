import { ModelDependencies } from "./index"
import { assert } from "../EventStore/Events"

type DishId = string
type ListId = string

export type DishList = {
  id: ListId
  dishes: DishId[]
}

export type DishListModel = ReturnType<typeof DishListFactory>

const lists = {} as Record<ListId, DishList>

export default function DishListFactory(dependencies: ModelDependencies) {
  const { store, models, modelWriter, modelReader } = dependencies
  const events = {
    addDishToList(dishId: string, listId: string) {
      assert(dishId, "no dish id")
      assert(listId, "no list id")
      return { type: "addDishToList", dishId, listId }
    },

    removeDishFromList(dishId: string, listId: string) {
      assert(dishId, "no dish id")
      assert(listId, "no list id")
      assert(models.dishList.getById(listId), "unkown dishList")
      return { type: "removeDishFromList", dishId, listId }
    },
  }

  store
    .on(events.addDishToList, event => {
      const { dishId, listId } = event as { dishId: DishId; listId: ListId }
      lists[listId] = lists[listId] || { id: listId, dishes: [] }
      if (!lists[listId].dishes.includes(dishId)) {
        lists[listId].dishes.push(dishId)
      }
      modelWriter.writeDishlist(lists[listId])
    })
    .on(events.removeDishFromList, event => {
      const { dishId, listId } = event as { dishId: DishId; listId: ListId }
      lists[listId].dishes = lists[listId].dishes.filter(id => id !== dishId)
      modelWriter.writeDishlist(lists[listId])
    })

  modelReader("dishLists").forEach((data: DishList) => (lists[data.id] = data))

  return {
    reset: () => Object.assign(lists, {}),
    getById: (listId: ListId) => lists[listId]?.dishes,
    events,
  }
}
