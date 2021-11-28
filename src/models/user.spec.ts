import Store from "../EventStore/Store.mock"
import MockedModel from "./MockedModel"

const store = Store()
const models = MockedModel({ store })

const testPerson = {
  id: "4711",
  email: "test@example.com",
  firstName: "Tom",
}

const { userAdded } = models.user.events

describe("Models.user", () => {
  beforeEach(() => models.user.reset())

  it("should retrieve all users", () => {
    store.dispatch(userAdded(testPerson))
    expect(models.user.getAll()).toEqual([testPerson])
  })

  it("should retrieve a single user by id", () => {
    store.dispatch(userAdded(testPerson))
    expect(models.user.getById("4711")).toEqual(testPerson)
  })

  it("should throw if a user is not found by id", () => {
    store.dispatch(userAdded(testPerson))
    expect(() => models.user.getById("666")).toThrow(`User '666' doesn't exist`)
  })

  it("should retrieve a single user by email", () => {
    store.dispatch(userAdded(testPerson))
    expect(models.user.getByEMail("test@example.com")).toEqual(testPerson)
  })

  it("should throw if a user is not found by email", () => {
    store.dispatch(userAdded(testPerson))
    expect(() => models.user.getByEMail("unknown@example.com")).toThrow(
      `No user found with this e-mail address`
    )
  })
})
