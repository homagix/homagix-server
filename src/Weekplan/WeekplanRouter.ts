import express, { Request, Router } from 'express'
import { Auth } from '../auth/auth'
import { JSONHandler } from '../MainRouter'
import { User } from '../models/user'
import { WeekplanController } from './WeekplanController'

export default ({
  controller,
  jsonResult,
  auth,
}: {
  controller: WeekplanController
  jsonResult: JSONHandler
  auth: Auth
}): Router => {
  const router = express.Router()

  function getWeekplan(req: Request) {
    return controller.getWeekplan(
      req.user as User,
      req.params.date,
      req.query && req.query.inhibit
        ? (req.query.inhibit as string).split(',')
        : []
    )
  }

  function fixPlan(req: Request) {
    return controller.fixPlan(
      req.user as User,
      req.params.date,
      req.body.accepted
    )
  }

  router.use(auth.requireJWT())
  router.get('/:date', jsonResult(getWeekplan))
  router.post('/:date/fix', jsonResult(fixPlan))

  return router
}
