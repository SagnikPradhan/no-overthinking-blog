import Router from '@koa/router'

import { UserModel } from '../models/user'
import { RouterContext } from '../app'

export const userRouter = new Router<{}, RouterContext>()

userRouter.get('/me', async ({ session, response }) => {
  if (session.userId) response.body = await UserModel.findById(session.userId)
  else response.body = {}
})
