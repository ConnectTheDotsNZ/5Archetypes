import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";
import { ensureUserForSession } from "./userProvisioning";

// This environment's Auth0 app was configured with the v3-SDK-style env var
// names (AUTH0_BASE_URL, AUTH0_ISSUER_BASE_URL); the v4 SDK used here expects
// APP_BASE_URL and a bare `domain` hostname instead. Bridge the two so either
// naming works without the Auth0 dashboard config having to change.
const appBaseUrl = process.env.APP_BASE_URL ?? process.env.AUTH0_BASE_URL;
const domain =
  process.env.AUTH0_DOMAIN ??
  (process.env.AUTH0_ISSUER_BASE_URL ? new URL(process.env.AUTH0_ISSUER_BASE_URL).host : undefined);

export const auth0 = new Auth0Client({
  appBaseUrl,
  domain,
  // The Auth0 application's allowed callback URL is already registered as
  // http://localhost:3000/api/auth/callback (v3-style path) — match it here
  // instead of the v4 default of /auth/*.
  routes: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    callback: "/api/auth/callback",
  },
  // This app never calls a separate resource server from the browser, so
  // don't expose access tokens to the client.
  enableAccessTokenEndpoint: false,
  async onCallback(error, ctx, session) {
    const base = ctx.appBaseUrl ?? appBaseUrl!;
    if (error) {
      return NextResponse.redirect(new URL(`/?authError=${encodeURIComponent(error.message)}`, base));
    }
    if (session?.user) {
      // First-ever login for this identity creates its Organization + User row.
      await ensureUserForSession(session.user);
    }
    return NextResponse.redirect(new URL(ctx.returnTo || "/admin/teams", base));
  },
});
