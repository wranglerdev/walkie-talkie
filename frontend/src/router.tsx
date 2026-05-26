import {
  createRouter,
  createRoute,
  createRootRouteWithContext,
  redirect,
  Outlet,
} from "@tanstack/react-router"
import LoginPage from "./pages/LoginPage"
import HomePage from "./pages/HomePage"
import HistoryPage from "./pages/HistoryPage"
import LogPage from "./pages/LogPage"
import ContextPage from "./pages/ContextPage"
import BacklogPage from "./pages/BacklogPage"
import BottomNav from "./components/BottomNav"

type AuthSession = { user: unknown; session: unknown } | null | undefined

type RouterContext = {
  auth: {
    session: AuthSession
  }
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
})

const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_authenticated",
  beforeLoad: ({ context, location }) => {
    if (!context.auth.session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      })
    }
  },
  component: () => (
    <div className="flex flex-col min-h-screen bg-base-100">
      <Outlet />
      <BottomNav />
    </div>
  ),
})

const homeRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/",
  component: HomePage,
})

const historyRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/history",
  component: HistoryPage,
})

const logRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/logs/$id",
  component: LogPage,
})

const contextRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/context",
  component: ContextPage,
})

const backlogRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/backlog",
  component: BacklogPage,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  authenticatedRoute.addChildren([homeRoute, historyRoute, logRoute, contextRoute, backlogRoute]),
])

export const router = createRouter({
  routeTree,
  context: {
    auth: { session: undefined },
  },
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
