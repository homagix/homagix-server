import { NextFunction, Request, Response } from "express"
import { User } from "../models/user"

export const testUser: User = {
  id: "42",
  listId: "007",
  firstName: "Toni",
  email: "toni@localhost",
}
export const otherUser: User = {
  id: "666",
  firstName: "Otto",
  email: "otto@localhost",
}
export const testAdmin: User = {
  id: "007",
  isAdmin: true,
  firstName: "Addi",
  email: "addi@localhost",
}
export const testContributor: User = {
  id: "77",
  listId: "007",
  firstName: "James",
  email: "james@localhost",
}
export const validToken = "user-token"
export const adminToken = "admin-token"

function readToken(req: Request): void {
  const match = req.headers?.authorization?.match(/Bearer (.*)/)
  if (match && match.length === 2) {
    const token = match[1]
    if (token === validToken) {
      req.user = testUser
    } else if (token === adminToken) {
      req.user = testAdmin
    }
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.user) {
    next()
  } else {
    res.status(401).json({ error: "Not authenticated" })
  }
}

const auth = {
  checkJWT:
    () =>
    (req: Request, res: Response, next: NextFunction): void => {
      readToken(req)
      next()
    },

  requireAuth,

  requireJWT:
    () =>
    (req: Request, res: Response, next: NextFunction): void => {
      readToken(req)
      requireAuth(req, res, next)
    },
}

export default auth
