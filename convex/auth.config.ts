// Clerk JWT bridge. Convex reads CLERK_ISSUER_URL from the deployment's
// env vars; when unset, the providers array is empty and the deployment
// runs in anonymous mode — every request looks like an unauthenticated
// visitor and the drawings functions skip ownership checks.

const issuerUrl = process.env.CLERK_ISSUER_URL;

export default {
  providers: issuerUrl
    ? [
        {
          domain: issuerUrl,
          applicationID: "convex",
        },
      ]
    : [],
};
