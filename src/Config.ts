import path from "path"

type Config = {
  nodeEnv: string
  baseDir: string
  dataDir: string
  PORT: number
}

export default function (): Config {
  const baseDir = process.env.BASEDIR || process.cwd()
  const config = {
    nodeEnv: process.env.NODE_ENV || "development",
    baseDir,
    dataDir: path.resolve(baseDir, "data"),
    PORT: parseInt(process.env.PORT || "8200"),
  }

  return config
}
