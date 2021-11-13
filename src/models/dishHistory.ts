import { Models } from '.'
import { Event, Store } from '../EventStore/EventStore'
import { ModelWriter } from './ModelWriter'
import { User } from './user'

type DishId = string
type DateString = string
type ListId = string

export type HistoryModel = {
  getFrom(user: User, date: DateString): string[][]
}

type HistoryEntry = Record<DateString, DishId>
const history = {} as Record<ListId, HistoryEntry>

function getFrom(user: User, date: DateString) {
  const ownHistory = history[user.listId || user.id] || {}
  const commonHistory = history[''] || {}
  const list = { ...ownHistory, ...commonHistory }
  return Object.entries(list).filter(([d]) => d >= date)
}

export default function ({
  store,
  models,
  modelWriter,
}: {
  store: Store
  models: Models
  modelWriter: ModelWriter
}): HistoryModel {
  function served(event: Event): void {
    const {
      dishId,
      date,
      listId = '',
    } = event as {
      dishId: string
      date: string
      listId?: string
    }
    history[listId] = history[listId] || {}
    history[listId][date] = dishId
    modelWriter.writeDishHistory(listId, history[listId])
  }

  store.on(models.dish.events.served, served)

  return {
    getFrom,
  }
}
