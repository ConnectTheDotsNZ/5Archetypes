import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

// /teams/demo renders fictional in-memory data and stays public; every other
// /teams/** and /admin/** route touches real org-scoped data and requires login.
const PUBLIC_TEAM_PATH_PREFIX = "/teams/demo";

function requiresLogin(pathname: string): boolean {
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/teams/") && !pathname.startsWith(PUBLIC_TEAM_PATH_PREFIX)) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const authRes = await auth0.middleware(request);

  // Let the SDK's own routes (login/logout/callback/...) through untouched.
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    return authRes;
  }

  if (requiresLogin(request.nextUrl.pathname)) {
    const session = await auth0.getSession(request);
    if (!session) {
      const loginUrl = new URL("/api/auth/login", request.url);
      loginUrl.searchParams.set("returnTo", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return authRes;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
