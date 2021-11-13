import Dish, { DishModel } from './dish'
import Ingredient, { IngredientModel } from './ingredient'
import DishHistory, { HistoryModel } from './dishHistory'
import DishList, { DishListModel } from './dishList'
import User, { UserModel } from './user'
import { Store } from '../EventStore/EventStore'
import { ModelWriter } from './ModelWriter'

export type Models = {
  dish: DishModel
  ingredient: IngredientModel
  dishHistory: HistoryModel
  dishList: DishListModel
  user: UserModel
}

export default function ({
  store,
  modelWriter,
}: {
  store: Store
  modelWriter: ModelWriter
}): Models {
  const models = {} as Models

  models.dish = Dish({ store, modelWriter })
  models.ingredient = Ingredient({ store, models, modelWriter })
  models.dishHistory = DishHistory({ store, models, modelWriter })
  models.dishList = DishList({ store, models, modelWriter })
  models.user = User({ store, modelWriter })

  return models
}
