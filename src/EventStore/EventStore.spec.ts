import EventStore, { Store } from "./EventStore"
import logger from "../lib/MockLogger"

function testEvent(param1?: number, param2?: string) {
  return { type: "testEvent", param1, param2 }
}

let store: Store

describe("EventStore.test", () => {
  beforeEach(() => {
    logger.reset()
  })

  afterEach(async () => {
    expect(logger.log).toEqual([])
  })

  it("should deliver events", async () => {
    store = EventStore({})
    let delivered = false
    store.on(testEvent, () => (delivered = true))
    await store.dispatch(testEvent())
    expect(delivered).toBe(true)
  })
})
