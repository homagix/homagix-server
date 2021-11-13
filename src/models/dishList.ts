import { Models } from '.'
import { assert } from '../EventStore/Events'
import { Event, Store } from '../EventStore/EventStore'
import { ModelWriter } from './ModelWriter'

type DishId = string
type ListId = string
type WriterFunction = (listId: ListId, dishList: DishList) => void

export type DishList = DishId[]

export type DishListModel = {
  reset(): void
  getById(listId: string): DishList

  events: {
    addDishToList(dishId: string, listId: string): Event
    removeDishFromList(dishId: string, listId: string): Event
  }
}

const lists = {} as Record<ListId, DishList>

function addDish(writer: WriterFunction, event: Event) {
  const { dishId, listId } = event as { dishId: DishId; listId: ListId }
  lists[listId] = lists[listId] || []
  lists[listId].includes(dishId) || lists[listId].push(dishId)
  writer(listId, lists[listId])
}

function removeDish(writer: WriterFunction, event: Event) {
  const { dishId, listId } = event as { dishId: DishId; listId: ListId }
  lists[listId] = lists[listId].filter(id => id !== dishId)
  writer(listId, lists[listId])
}

export default function ({
  store,
  models,
  modelWriter,
}: {
  store: Store
  models: Models
  modelWriter: ModelWriter
}): DishListModel {
  const events = {
    addDishToList(dishId: string, listId: string) {
      assert(dishId, 'no dish id')
      assert(listId, 'no list id')
      return { type: 'addDishToList', dishId, listId }
    },

    removeDishFromList(dishId: string, listId: string) {
      assert(dishId, 'no dish id')
      assert(listId, 'no list id')
      assert(models.dishList.getById(listId), 'unkown dishList')
      return { type: 'removeDishFromList', dishId, listId }
    },
  }
  store
    .on(events.addDishToList, event =>
      addDish(modelWriter.writeDishlist, event)
    )
    .on(events.removeDishFromList, event =>
      removeDish(modelWriter.writeDishlist, event)
    )

  return {
    reset: () => Object.assign(lists, {}),
    getById: listId => lists[listId],
    events,
  }
}
