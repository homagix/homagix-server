import expect from "expect"
import request from "supertest"
import express, { NextFunction, Request, Response } from "express"
import bodyParser from "body-parser"
import SessionRouter from "./SessionRouter"

const app = express()
const log = [] as string[]
const testUser = {
  id: 4711,
  email: "test@example.com",
  access_code: "test-access-code",
}

const auth = {
  requireJWT() {
    return function (req: Request, res: Response, next: NextFunction) {
      log.push("auth.requireJWT")
      if (req.headers.authorization === "test-token") {
        req.user = testUser
      }
      next()
    }
  },

  requireLogin() {
    return function (req: Request, res: Response, next: NextFunction) {
      log.push("auth.requireLogin")
      if (
        req.body.email === "test@example.com" &&
        req.body.password === "test-password"
      ) {
        req.user = testUser
      }
      next()
    }
  },

  signIn() {
    log.push("auth.signIn")
    return "test-token"
  },

  logout() {
    log.push("auth.logout")
  },
}

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
const router = SessionRouter({ auth })
app.use("/session", router)

describe("SessionRouter", () => {
  beforeEach(() => {
    log.length = 0
  })

  describe("GET /session", () => {
    it("should report if a user is not logged in", async () => {
      const response = await request(app)
        .get("/session")
        .expect(200)
        .expect("Content-Type", /json/)

      expect(response.body.id).toBeUndefined()
    })

    it("should retrieve info about the logged in user", async () => {
      const response = await request(app)
        .get("/session")
        .set("authorization", "test-token")
        .expect(200)
        .expect("Content-Type", /json/)

      expect(response.body).toEqual({
        id: 4711,
        email: "test@example.com",
        access_code: "test-access-code",
      })
    })
  })

  describe("POST /session", () => {
    it("should log in users", async () => {
      const response = await request(app)
        .post("/session")
        .set("Content-Type", "application/json")
        .send(
          JSON.stringify({
            email: "test@example.com",
            password: "test-password",
          })
        )
        .expect(200)
        .expect("Content-Type", /json/)

      expect(response.body).toEqual(testUser)
      expect(log).toEqual(["auth.requireLogin"])
    })
  })

  describe("GET /session/logout", () => {
    it(`should invalidate the user's session`, async () => {
      await request(app).get("/session/logout").expect(200)
      expect(log).toEqual(["auth.logout"])
    })
  })
})
