import path from "path"
import express, { NextFunction, Request, Response } from "express"
import cookieParser from "cookie-parser"
import Models from "./models/index"
import EventStore from "./EventStore/EventStore"
import DishReader from "./Dishes/DishReader"
import MainRouter from "./MainRouter"
import ModelWriter from "./models/ModelWriter"
import Auth from "./auth/auth"
import listRoutes from "./lib/listRoutes"
import Config from "./Config"

const logger = console
const isDev = process.env.NODE_ENV === "development"

const { nodeEnv, baseDir, dataDir, PORT } = Config()

const store = EventStore({ logger })
const modelWriter = ModelWriter({ basePath: dataDir })
const models = Models({ store, modelWriter })

const dishReader = DishReader({ store, models })

const app = express()
app.set("json spaces", 2)
app.use(cookieParser())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
const auth = Auth({ app, models, store, secretOrKey: process.env.SECRET || "" })
const router = MainRouter({ models, store, auth })

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",")

app.use((req, res, next) => {
  const origin = req.headers["origin"] as string
  if (isDev || (allowedOrigins && allowedOrigins?.includes(origin))) {
    res.header("Access-Control-Allow-Origin", origin)
    res.header("Access-Control-Allow-Methods", "*")
    res.header("Access-Control-Allow-Headers", "*")
  }
  next()
})

app.use((req, res, next) => {
  logger.debug(req.method + " " + req.path)
  next()
})

app.use("/", router)
app.use("/images", express.static(path.join(dataDir, "images")))

app.use(function (
  err: { code?: number; message?: string },
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  logger.error(err)
  res.status(err.code || 500).json({ error: err.message || err.toString() })
})

app.listen(PORT, async () => {
  dishReader.loadData(dataDir)
  logger.info(`  > NODE_ENV: ${nodeEnv}`)
  logger.info(`  > baseDir:  ${baseDir}`)
  logger.info(`  > dataDir:  ${dataDir}`)
  logger.info(`  > Server:   http://localhost:${PORT}/`)
})

console.log(listRoutes(app))
