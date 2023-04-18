import { describe, expect, it } from "vitest"
import { parse, stringify } from "yaml"

const dish1 = `id: 777
recipe: |
  1. first do this
  1. then do that
`

describe("Reader/Writer", () => {
  it("should read a dish recipe if it contains a list", () => {
    const dish = parse(dish1)
    expect(dish.recipe).toBe("1. first do this\n1. then do that\n")
  })

  it("should serialize a recipe as expected", () => {
    const result = stringify({
      id: 777,
      recipe: "1. first do this\n1. then do that\n",
    })
    expect(result).toBe(dish1)
  })
})
