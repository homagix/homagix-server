import { Models } from '.'
import { assert } from '../EventStore/Events'
import { Event, Store } from '../EventStore/EventStore'
import { ModelWriter } from './ModelWriter'

type IngredientId = string

export type Ingredient = {
  id?: IngredientId
  name: string
  unit: string
  group: string
}

type WriterFunction = (ingredient: Ingredient) => void

export type IngredientModel = {
  getAll(): Ingredient[]
  byId(id: IngredientId): Ingredient | undefined
  byName(name: string): Ingredient | undefined
  byExample(item: Partial<Ingredient>, strict?: boolean): Ingredient | undefined
  events: {
    ingredientAdded(ingredient: Ingredient): Event
    ingredientUpdated(ingredientId: string, name: string, value: unknown): Event
  }
}

const ingredients = {
  byId: {} as Record<IngredientId, Ingredient>,
  byName: {} as Record<IngredientId, Ingredient>,
}

const aliases = {} as Record<IngredientId, IngredientId>

const ingredientFields = ['name', 'unit', 'group']

export function addIngredient(writer: WriterFunction, event: Event): void {
  const data = event as Ingredient
  const ingredient = {
    id: '' + data.id,
    name: data.name.trim(),
    unit: data.unit,
    group: data.group || '',
  }
  const existing = ingredients.byName[ingredient.name.toLowerCase()]
  if (existing) {
    aliases['' + ingredient.id] = '' + existing.id
  } else {
    ingredient.group = ingredient.group || 'other'
    ingredients.byId['' + ingredient.id] = ingredient
    ingredients.byName[ingredient.name.toLowerCase()] = ingredient
    writer(ingredient)
  }
}

export function updateIngredient(writer: WriterFunction, event: Event): void {
  const { ingredientId, name, value } = event as {
    ingredientId: IngredientId
    name: string
    value: string
  }
  if (!ingredientFields.includes(name)) {
    throw Error(`Trying to set an unknown field of ingredient`)
  }
  const ingredient = getIngredientById(ingredientId)
  if (!ingredient) {
    throw Error('Ingredient not found')
  }
  ingredient[name as keyof Ingredient] = value
  writer(ingredient)
}

function getAll(): Ingredient[] {
  return Object.values(ingredients.byId)
}

export function getIngredientById(id: IngredientId): Ingredient | undefined {
  if (aliases['' + id]) {
    return ingredients.byId[aliases['' + id]]
  }
  return ingredients.byId[id]
}

export function getIngredientByName(name: string): Ingredient | undefined {
  return ingredients.byName[name]
}

function byExample(
  item: Partial<Ingredient>,
  strict = false
): Ingredient | undefined {
  if (item.id) {
    return ingredients.byId[item.id]
  }
  if (item.name) {
    const pattern = new RegExp(
      strict
        ? '^' + item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'
        : item.name
    )
    return Object.values(ingredients.byId).find(i => i.name.match(pattern))
  }
}

export default function ({
  store,
  models,
  modelWriter,
}: {
  store: Store
  models: Models
  modelWriter: ModelWriter
}): IngredientModel {
  const events = {
    ingredientAdded(ingredient: Ingredient) {
      assert(ingredient, 'No ingredient')
      assert(ingredient.name, 'Missing name')
      return {
        type: 'ingredientAdded',
        id: ingredient.id,
        unit: ingredient.unit,
        name: ingredient.name,
        group: ingredient.group,
      }
    },

    ingredientUpdated(ingredientId: string, name: string, value: unknown) {
      assert(ingredientId, 'No ingredientId')
      assert(name !== '', 'No attribute Name')
      assert(models.ingredient.byId(ingredientId), 'Ingredient not found')
      return { type: 'ingredientUpdated', ingredientId, name, value }
    },
  }

  store
    .on(events.ingredientAdded, event =>
      addIngredient(modelWriter.writeIngredient, event)
    )
    .on(events.ingredientUpdated, event =>
      updateIngredient(modelWriter.writeIngredient, event)
    )

  return {
    getAll,
    byId: getIngredientById,
    byName: getIngredientByName,
    byExample,
    events,
  }
}
