import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, SignedIn, SignedOut, SignIn, useAuth } from "@clerk/clerk-react";
import App from "./App";
import { CONVEX_URL, USE_CONVEX } from "./storage";
import "./index.css";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const USE_CLERK = Boolean(CLERK_PUBLISHABLE_KEY);

// Restore theme preference before first paint so the page doesn't flash.
(() => {
  const stored = localStorage.getItem("excalidraw-standalone.theme");
  const dark =
    stored === "dark" ||
    (stored !== "light" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
})();

const root = createRoot(document.getElementById("root")!);

function SignInGate() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <SignIn routing="hash" />
    </div>
  );
}

if (USE_CLERK && USE_CONVEX) {
  // Clerk + Convex: ConvexProviderWithClerk forwards the Clerk session
  // token to every Convex call so the deployment can scope queries by
  // identity.
  const convex = new ConvexReactClient(CONVEX_URL!);
  root.render(
    <StrictMode>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY!}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <SignedIn>
            <App />
          </SignedIn>
          <SignedOut>
            <SignInGate />
          </SignedOut>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </StrictMode>,
  );
} else if (USE_CLERK) {
  // Clerk only (local storage backend). Still gates the UI so the app
  // requires a signed-in user.
  root.render(
    <StrictMode>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY!}>
        <SignedIn>
          <App />
        </SignedIn>
        <SignedOut>
          <SignInGate />
        </SignedOut>
      </ClerkProvider>
    </StrictMode>,
  );
} else if (USE_CONVEX) {
  // Convex without auth — anonymous shared-bucket mode.
  const convex = new ConvexReactClient(CONVEX_URL!);
  root.render(
    <StrictMode>
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    </StrictMode>,
  );
} else {
  // Fully local. No backend, no auth.
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
