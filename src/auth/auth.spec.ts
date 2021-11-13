import expect from "expect"
import jsonwebtoken from "jsonwebtoken"
import AuthFactory, { AuthUser } from "./auth"
import Store from "../EventStore/Store.mock"
import Models from "../models/MockedModel"
import { User } from "../models/user"
import express, { RequestHandler, Request, Response } from "express"
import { mockRequest, mockResponse } from "mock-req-res"

const app = express()
const store = Store()
const models = Models({ store })
const users = [
  {
    id: "4711",
    firstName: "Test",
    email: "test@example.com",
    access_code: "test-access-1",
    password: "$2a$10$5cblct/kPaZQ5uh9jNKIVu8.oGiOPDPGB4iZRdNp0E1miYl6jTqXm",
  },
  { id: "4712", firstName: "Test2", email: "test2@example.com" },
  {
    id: "4713",
    firstName: "Test3",
    email: "test3@example.com",
    access_code: "test-access",
    hash: "test-hash",
    isAdmin: true,
  },
]
users.forEach(user => store.dispatch(models.user.events.userAdded(user)))

const secretOrKey = "secret-key"
const auth = AuthFactory({ app, models, store, secretOrKey })

type UserEvent = Event & { user: AuthUser }

function userId(user: Express.User | undefined): string {
  expect(user).not.toBeUndefined()
  expect(user).toHaveProperty("id")
  return (user as { id: string })?.id
}

describe("auth", () => {
  function tryMiddleware(
    middleWare: RequestHandler,
    req: Request,
    res: Response,
    expectedUserId: string,
    done: jest.DoneCallback
  ) {
    middleWare(req, res, (err: unknown) => {
      expect(err).toBeUndefined()
      expect(userId(req.user)).toBe(expectedUserId)
      done()
    })
  }

  describe("requireLogin", () => {
    it("should authenticate with e-mail and password", done => {
      const req = mockRequest({
        body: { email: "test@example.com", password: "test-pwd" },
        user: undefined as User | undefined,
      })
      tryMiddleware(auth.requireLogin(), req, mockResponse(), "4711", done)
    })

    it("should generate a JWT if authenticated with e-mail and password", done => {
      const middleware = auth.requireLogin()
      const req = mockRequest({
        body: { email: "test@example.com", password: "test-pwd" },
      })
      const res = mockResponse()
      middleware(req, res, () => {
        expect(res.cookie.calledOnce).toBe(true)
        expect(res.cookie.args[0][1]).not.toBe("")
        expect(res.cookie.args[0][1]).not.toBeUndefined()
        jsonwebtoken.verify(
          res.cookie.args[0][1],
          secretOrKey,
          (err: unknown, decoded) => {
            expect(err).toBeNull()
            expect(decoded).toHaveProperty("iat")
            expect(decoded).toHaveProperty("exp")
            done()
          }
        )
      })
    })

    it("should not authenticate with e-mail and wrong password", done => {
      const middleware = auth.requireLogin()
      const req = mockRequest({
        body: { email: "test@example.com", password: "wrong-pwd" },
      })
      const res = mockResponse()
      middleware(req, res, () => {
        expect(true).toBe(false)
      })
      setTimeout(() => {
        expect(res.status.callCount).toBe(1)
        expect(res.status.args[0][0]).toBe(401)
        expect(res.json.callCount).toBe(1)
        expect(res.json.args[0][0]).toEqual({ error: "Not authenticated" })
        done()
      }, 100)
    })
  })

  describe("checkJWT", () => {
    it("should add the user to the request if a valid JWT is found in the header", done => {
      const authorization = jsonwebtoken.sign({ sub: 4712 }, secretOrKey, {
        expiresIn: "24h",
      })
      const req = mockRequest({
        body: { email: "test3@example.com" },
        headers: { authorization },
        user: undefined as User | undefined,
      })
      tryMiddleware(auth.checkJWT(), req, mockResponse(), "4712", done)
    })

    it("should add the user to the request if a valid JWT is given in cookie", done => {
      const token = jsonwebtoken.sign({ sub: 4712 }, secretOrKey, {
        expiresIn: "24h",
      })
      const req = mockRequest({
        body: { email: "test3@example.com" },
        cookies: { token },
        user: undefined as User | undefined,
      })
      tryMiddleware(auth.requireJWT(), req, mockResponse(), "4712", done)
    })
  })

  describe("requireJWT", () => {
    it("should authenticate with JWT in header", done => {
      const authorization = jsonwebtoken.sign({ sub: 4712 }, secretOrKey, {
        expiresIn: "24h",
      })
      const req = mockRequest({
        body: { email: "test3@example.com" },
        headers: { authorization },
        user: undefined as User | undefined,
      })
      tryMiddleware(auth.requireJWT(), req, mockResponse(), "4712", done)
    })

    it("should authenticate with JWT in cookie", done => {
      const token = jsonwebtoken.sign({ sub: 4712 }, secretOrKey, {
        expiresIn: "24h",
      })
      const req = mockRequest({
        body: { email: "test3@example.com" },
        cookies: { token },
        user: undefined as User | undefined,
      })
      tryMiddleware(auth.requireJWT(), req, mockResponse(), "4712", done)
    })
  })

  describe("requireAdmin", () => {
    it("should require a user to be admin", done => {
      models.user.adminIsDefined = true
      const middleware = auth.requireAdmin()
      const req = mockRequest({ user: { id: 4711 } })
      const res = mockResponse({ status: 403, message: "Not allowed" })
      middleware(req, res, (err: unknown) => {
        expect(err).toEqual({ status: 403, message: "Not allowed" })
        done()
      })
    })

    it("should allow access for admins", done => {
      models.user.adminIsDefined = true
      const middleware = auth.requireAdmin()
      const req = mockRequest({ user: { id: 4712, isAdmin: true } })
      const res = mockResponse()
      middleware(req, res, (err: unknown) => {
        expect(err).toBeUndefined()
        done()
      })
    })

    it("should allow access if no admin is defined", done => {
      models.user.adminIsDefined = false
      const middleware = auth.requireAdmin()
      const req = mockRequest({ user: { id: 4711 } })
      const res = mockResponse()
      middleware(req, res, (err: unknown) => {
        expect(err).toBeUndefined()
        models.user.adminIsDefined = true
        done()
      })
    })
  })

  it("should clear the cookie if logged out", async () => {
    const response = mockResponse()
    auth.logout(response)
    expect(response.cookie.calledOnce).toBe(true)
    expect(response.cookie.args[0][0]).toBe("token")
    expect(response.cookie.args[0][1]).toBe("")
  })

  it("should change the password", async () => {
    const eventList = store.eventList() as unknown as UserEvent[]
    eventList.length = 0
    const user = models.user.getById("4713")
    auth.setPassword(user, "new-password")
    expect(eventList.length).toBe(1)
    const event = eventList[0]
    expect(event).toHaveProperty("type", "userChanged")
    expect(event).toHaveProperty("id", "4713")
    expect(event).toHaveProperty("user")
    expect(event.user.password?.substr(0, 7)).toBe("$2a$10$")
  })

  it("should clear the access code after setting the password", async () => {
    store.eventList().length = 0
    const user = models.user.getById("4713")
    auth.setPassword(user, "new-password")
    expect((store.eventList()[0].user as AuthUser).accessCode).toBe("")
  })
})
