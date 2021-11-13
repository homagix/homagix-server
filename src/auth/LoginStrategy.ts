import { UserModel } from "../models/user"
import { Request } from "express"
import { Strategy } from "passport"
import { AuthUser } from "./auth"
import bcrypt from "bcryptjs"

type GetUserFunc = (email: string) => AuthUser | undefined

export default class LoginStrategy extends Strategy {
  getUser: GetUserFunc

  constructor(userModel: UserModel) {
    super()
    this.name = "login"
    this.getUser = userModel.getByEMail as unknown as GetUserFunc
  }

  authenticate(req: Request): void {
    try {
      const body = req.body
      if (!body.email || !body.password) {
        throw Error("no credentials provided")
      }
      const user = this.getUser(body.email)
      if (user && bcrypt.compareSync(body.password, user.password || "")) {
        this.success(user)
      } else {
        throw Error("wrong email or password")
      }
    } catch (error) {
      this.fail((error as Error).toString())
    }
  }
}
