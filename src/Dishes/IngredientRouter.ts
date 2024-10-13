import express, { Request, Router } from "express"
import { JSONHandler } from "../MainRouter"
import units from "../models/units"
import { IngredientController } from "./IngredientController"

export default function ({
  controller,
  jsonResult,
}: {
  controller: IngredientController
  jsonResult: JSONHandler
}): Router {
  const router = express.Router()

  function getAvailableUnits() {
    return units
  }

  function setIngredientGroup(req: Request) {
    return controller.setIngredientGroup(req.params.id, req.body.group)
  }

  function addIngredient(req: Request) {
    return controller.addIngredient(req.body)
  }

  router.get("/", jsonResult(controller.getIngredients))
  router.get("/units", jsonResult(getAvailableUnits))
  router.put("/:id", jsonResult(setIngredientGroup))
  router.post("/", jsonResult(addIngredient))

  return router
}
