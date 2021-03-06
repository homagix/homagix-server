import { HTTPError } from "./lib/HTTPError"
import path from "path"
import express, { NextFunction, Request, Response } from "express"
import cookieParser from "cookie-parser"
import Models from "./models/index"
import EventStore from "./EventStore/EventStore"
import DishReader from "./Dishes/DishReader"
import MainRouter from "./MainRouter"
import ModelReader from "./models/ModelReader"
import ModelWriter from "./models/ModelWriter"
import Auth from "./auth/auth"
import listRoutes from "./lib/listRoutes"
import Config from "./Config"

const logger = console
const isDev = process.env.NODE_ENV === "development"

const { nodeEnv, baseDir, dataDir, PORT } = Config()

const store = EventStore({ logger })
const modelReader = ModelReader(dataDir)
const modelWriter = ModelWriter(dataDir)
const models = Models({ store, modelReader, modelWriter })

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

app.use(auth.checkJWT())

app.use((req, res, next) => {
  const user = (req.user && (req.user as { id: string }).id) || ""
  logger.debug(`${req.method} ${req.originalUrl} ${user}`)
  next()
})

app.use("/", router)
app.use("/images", express.static(path.join(dataDir, "images")))

app.use("/", (req: Request, res: Response, next: NextFunction) =>
  next(new HTTPError(404, "Not found"))
)

app.use(function (
  err: HTTPError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
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
