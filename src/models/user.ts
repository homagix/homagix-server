import { assert } from "../EventStore/Events"
import { Event, Store } from "../EventStore/EventStore"
import { ModelReader } from "./ModelReader"
import { ModelWriter } from "./ModelWriter"

export type User = {
  id: string
  firstName: string
  email?: string
  listId?: string
  isAdmin?: boolean
}

export type UserModel = ReturnType<typeof Factory>

export default function Factory({
  store,
  modelReader,
  modelWriter,
}: {
  store: Store
  modelReader: ModelReader
  modelWriter: ModelWriter
}) {
  const events = {
    userAdded(user: User) {
      assert(user, "No user")
      assert(user.id, "No id")
      assert(
        !user.email || user.email.match(/.+@.+\..+/),
        "email has wrong format",
      )
      return { type: "userAdded", user }
    },

    userRemoved(id: string) {
      assert(id, "No id")
      return { type: "userRemoved", id }
    },

    userChanged(id: string, user: User) {
      assert(id, "No id")
      assert(
        !user.email || user.email.match(/.+@.+\..+/),
        "email has wrong format",
      )
      return { type: "userChanged", id, user }
    },

    invitationAccepted(user: User, listId: string) {
      assert(user, "no user")
      assert(user.id, "no user id")
      assert(listId, "no list id")
      return { type: "invitationAccepted", userId: user.id, listId }
    },
  }

  const byEmail = {} as Record<string, User>
  const users = {} as Record<string, User>
  let adminIsDefined = false

  function addUser(user: User) {
    users[user.id] = user
    if (user.email) {
      byEmail[user.email] = user
    }
    if (user.isAdmin) {
      adminIsDefined = true
    }
  }

  store.on(events.userAdded, (event: Event) => {
    const { user } = event as { user: User }
    addUser(user)
    modelWriter.writeUser(user)
  })

  store.on(events.userRemoved, (event: Event) => {
    const { id } = event as { id: string }
    if (users[id].email) {
      delete byEmail[users[id].email as string]
    }
    delete users[id]
    modelWriter.removeUser(id)
  })

  store.on(events.userChanged, (event: Event) => {
    const { id, user } = event as { id: string; user: Partial<User> }
    if (user.email && users[id].email && byEmail[users[id].email as string]) {
      delete byEmail[users[id].email as string]
    }
    Object.assign(users[id], { ...user, id })
    if (user.email) {
      byEmail[user.email] = users[id]
    }
    modelWriter.writeUser(users[id])
  })

  store.on(events.invitationAccepted, (event: Event) => {
    const { userId, listId } = event as { userId: string; listId: string }
    users[userId].listId = listId
    modelWriter.writeUser(users[userId])
  })

  modelReader("users").forEach(addUser)

  return {
    getAll() {
      return Object.values(users)
    },

    getById(userId: string) {
      const user = users[userId]
      if (user) {
        return user
      }
      throw Error(`User '${userId}' doesn't exist`)
    },

    getByEMail(email: string, throwIfNotFound = true) {
      const user = byEmail[email]
      if (user || !throwIfNotFound) {
        return user
      }
      throw Error(`No user found with this e-mail address`)
    },

    adminIsDefined,
    events,

    reset() {
      function clear(obj: Record<string, unknown>) {
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            delete obj[key]
          }
        }
      }
      clear(byEmail)
      clear(users)
    },
  }
}
