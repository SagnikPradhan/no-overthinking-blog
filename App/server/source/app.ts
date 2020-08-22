import Koa from 'koa'
import Router from '@koa/router'
import session, { Session } from 'koa-session'
import bodyparser from 'koa-bodyparser'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

import { SessionStore } from './utils/session-storage'
import { createOAuthRouter } from './routes/oauth'
import { userRouter } from './routes/user'

export type RouterContext = { session: Session & { userId?: string } }

const main = async () => {
  // Constants
  dotenv.config()
  const PORT = process.env.PORT || 8080
  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
  const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
  const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID
  const SECRET_KEY = process.env.SECRET_KEY
  const MONGODB_URI = process.env.MONGODB_URI

  // Check constants
  if (typeof DISCORD_CLIENT_ID !== 'string') throw new Error('Invalid DISCORD_CLIENT_ID')
  if (typeof DISCORD_CLIENT_SECRET !== 'string') throw new Error('Invalid DISCORD_CLIENT_SECRET')
  if (typeof DISCORD_GUILD_ID !== 'string') throw new Error('Invalid DISCORD_GUILD_ID')
  if (typeof SECRET_KEY !== 'string') throw new Error('Invalid SECRET_KEY')
  if (typeof MONGODB_URI !== 'string') throw new Error('Invalid MONGODB_URI')

  // MONGODB
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  })

  // App
  const app = new Koa()
  const router = new Router<{}, RouterContext>()

  app.keys = [SECRET_KEY]

  // Routes
  const oauthRouter = createOAuthRouter({
    endpointUrl: `http://localhost:${PORT}/oauth`,
    discord: { clientId: DISCORD_CLIENT_ID, clientSecret: DISCORD_CLIENT_SECRET, guildId: DISCORD_GUILD_ID }
  })
  router
    .use('/oauth', oauthRouter.routes())
    .use('/user', userRouter.routes())

  // Middlewares
  app
    .use(session({ store: SessionStore() }, app))
    .use(bodyparser())
    .use(router.routes())
    .use(router.allowedMethods())

  // Start Listening
  app.listen(PORT, () => console.log(`Listening on ${PORT}`))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
