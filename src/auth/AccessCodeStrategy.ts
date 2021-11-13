import { UserModel } from "../models/user"
import { Request } from "express"
import { Strategy } from "passport"
import { AuthUser } from "./auth"

type GetUserFunc = (id: string) => AuthUser | undefined

export default class AccessCodeStrategy extends Strategy {
  getUser: GetUserFunc

  constructor(userModel: UserModel) {
    super()
    this.name = "access_code"
    this.getUser = userModel.getById as unknown as GetUserFunc
  }

  authenticate(req: Request): void {
    const accessCode = req.params.accessCode
    const id = req.params.id
    if (!accessCode || !id) {
      this.fail("access code or id not provided")
    } else {
      try {
        const user = this.getUser(id)
        if (user && user.accessCode === accessCode) {
          this.success(user)
        } else {
          this.fail("unknown access code")
        }
      } catch (error) {
        this.fail((error as Error).toString())
      }
    }
  }
}
