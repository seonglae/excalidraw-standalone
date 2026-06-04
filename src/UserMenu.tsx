// Clerk user button wrapper. The App.tsx import is gated by USE_CLERK so
// a localStorage-only build still tree-shakes Clerk entirely.

import { UserButton } from "@clerk/clerk-react";

export function UserMenu() {
  return <UserButton afterSignOutUrl="/" />;
}
