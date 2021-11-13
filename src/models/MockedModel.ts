import { Store } from '../EventStore/EventStore'
import ModelsFactory, { Models } from './index'

const emptyFunc = (): void => {
  // Don't do anything
}

const modelWriter = {
  writeDish: emptyFunc,
  writeIngredient: emptyFunc,
  writeUser: emptyFunc,
  removeUser: emptyFunc,
  writeDishlist: emptyFunc,
  writeDishHistory: emptyFunc,
}

export default ({ store }: { store: Store }): Models => {
  return ModelsFactory({ store, modelWriter })
}
