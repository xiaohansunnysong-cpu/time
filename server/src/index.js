import { Pool } from "pg"

import { createApp, migrate, poolConfig } from "./app.js"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error("DATABASE_URL is required")
  process.exit(1)
}

const pool = new Pool(poolConfig(databaseUrl))
await migrate(pool)

const port = Number(process.env.PORT || 8787)
const server = createApp(pool)
server.listen(port, "0.0.0.0", () => {
  console.log(`shijian-manghe-api listening on ${port}`)
})

function shutdown() {
  server.close(() => {
    void pool.end()
  })
}

process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)
