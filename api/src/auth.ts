import { betterAuth } from "better-auth"

export function createAuth(db: D1Database, secret: string, baseURL: string) {
  return betterAuth({
    database: db,
    secret,
    baseURL,
    emailAndPassword: {
      enabled: true,
    },
  })
}

export type Auth = ReturnType<typeof createAuth>
