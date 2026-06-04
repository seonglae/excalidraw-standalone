// Clerk user button wrapper. Only mounted when VITE_CLERK_PUBLISHABLE_KEY
// is set — the App.tsx import is the only Clerk reference outside main.tsx,
// so a localStorage-only build still tree-shakes Clerk entirely.

import { UserButton } from "@clerk/clerk-react";

export const USE_CLERK = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

export function UserMenu() {
  return <UserButton afterSignOutUrl="/" />;
}
