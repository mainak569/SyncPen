// `domain` must match the Clerk instance issuing the JWTs the app sends to
// Convex. It was hardcoded to one dev instance, which silently breaks auth if
// you point the app at a different (e.g. production) Clerk instance.
//
// Set CLERK_JWT_ISSUER_DOMAIN in the Convex deployment's environment variables
// (`npx convex env set CLERK_JWT_ISSUER_DOMAIN <url>`, or the dashboard) —
// note this is Convex's own env, not the app's .env file. The existing dev
// instance stays the default so current deployments keep working untouched.
const domain =
  process.env.CLERK_JWT_ISSUER_DOMAIN ||
  "https://worthy-clam-63.clerk.accounts.dev/";

const authConfig = {
  providers: [
    {
      domain,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
