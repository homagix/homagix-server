import { parse } from "yaml"
import { join } from "path"
import { readdirSync, readFileSync } from "fs"

export default function Factory(basePath: string) {
  function readYAMLFile(fileAndPath: string) {
    return parse(readFileSync(fileAndPath).toString())
  }

  function readYAMLFilesFrom(base: string) {
    return readdirSync(base).map(name => {
      const data = readYAMLFile(join(base, name))
      data.id = name.replace(/\.yaml$/, "")
      return data
    })
  }

  return (entityName: string) => readYAMLFilesFrom(join(basePath, entityName))
}

export type ModelReader = ReturnType<typeof Factory>
