import express, { Request, Response, Router } from 'express'
import { AuthUser, MiddleWare } from './auth'

export default ({
  auth,
}: {
  auth: {
    requireJWT: MiddleWare
    requireLogin: MiddleWare
    logout: (res: Response) => void
  }
}): Router => {
  function getUserInfo(req: Request, res: Response) {
    const user = { ...(req.user || {}) } as AuthUser
    delete user.password
    res.json(user)
  }

  function loginWithPassword(req: Request, res: Response) {
    return getUserInfo(req, res)
  }

  function logout(req: Request, res: Response) {
    auth.logout(res)
    res.json({})
  }

  const router = express.Router()

  router.get('/', auth.requireJWT({ allowAnonymous: true }), getUserInfo)
  router.post('/', auth.requireLogin(), loginWithPassword)
  router.get('/logout', logout)

  return router
}
