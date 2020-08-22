import { stores } from 'koa-session'

export const SessionStore = (): stores => {
  const store = new Map<string, { expiry: number, session: unknown }>()

  return {
    get: (key: string) => {
      const session = store.get(key)
      
      if (session) {
        if (session.expiry > Date.now()) return session.session
        else store.delete(key)
      }
    },
    set: (key: string, session: unknown, maxAge: number) => {
      const expiry = Date.now() + maxAge
      store.set(key, { expiry, session })
    },
    destroy: (key: string) => store.delete(key)
  }
}
