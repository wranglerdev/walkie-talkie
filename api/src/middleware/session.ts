import type { MiddlewareHandler } from "hono"
import type { Auth } from "../auth"

type Env = {
  Variables: { userId: string }
}

export function sessionMiddleware(auth: Auth): MiddlewareHandler<Env> {
  return async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session) {
      return c.json({ error: "Unauthorized" }, 401)
    }
    c.set("userId", session.user.id)
    await next()
  }
}
