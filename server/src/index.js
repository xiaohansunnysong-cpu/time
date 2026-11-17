import { createPool, ensureSchema } from "./db.js"
import { createApp } from "./http.js"

const port = Number(process.env.PORT || 8787)
if (!Number.isInteger(port) || port <= 0) {
  console.error("PORT must be a positive integer")
  process.exit(1)
}

const pool = createPool()
const server = createApp(pool)

try {
  await ensureSchema(pool)
} catch (error) {
  console.error("schema setup failed")
  console.error(error)
  process.exit(1)
}

server.listen(port, "0.0.0.0", () => {
  console.log(`plaza api listening on ${port}`)
})

function shutdown() {
  server.close(() => {
    pool.end().catch(() => {})
  })
}

process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)
