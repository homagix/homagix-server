import Dish, { DishModel } from "./dish"
import Ingredient, { IngredientModel } from "./ingredient"
import DishHistory, { HistoryModel } from "./dishHistory"
import DishList, { DishListModel } from "./dishList"
import User, { UserModel } from "./user"
import { Store } from "../EventStore/EventStore"
import { ModelWriter } from "./ModelWriter"
import { ModelReader } from "./ModelReader"

export type Models = {
  dish: DishModel
  ingredient: IngredientModel
  dishHistory: HistoryModel
  dishList: DishListModel
  user: UserModel
}

export type ModelDependencies = {
  store: Store
  models: Models
  modelWriter: ModelWriter
  modelReader: ModelReader
}

export default function ({
  store,
  modelWriter,
  modelReader,
}: {
  store: Store
  modelWriter: ModelWriter
  modelReader: ModelReader
}): Models {
  const models = {} as Models
  const dependencies: ModelDependencies = {
    store,
    models,
    modelWriter,
    modelReader,
  }

  models.dish = Dish(dependencies)
  models.ingredient = Ingredient(dependencies)
  models.dishHistory = DishHistory(dependencies)
  models.dishList = DishList(dependencies)
  models.user = User(dependencies)

  return models
}
