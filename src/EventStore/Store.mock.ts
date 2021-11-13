import { Event, EventType, Listener, Store } from "./EventStore"

export default (): Store & { eventList: () => Event[] } => {
  const listeners = {} as Record<string, Listener[]>
  const eventList = [] as Event[]

  return {
    eventList() {
      return eventList
    },

    on(type: EventType, func: Listener) {
      listeners[type.name] = listeners[type.name] || []
      listeners[type.name].push(func)
      return this
    },

    async dispatch(event: Event) {
      eventList.push(event)
      ;(listeners[(event as { type: string }).type] || []).forEach(listener =>
        listener(event)
      )
    },
  }
}
