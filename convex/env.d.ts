// Convex functions run in a Node-like sandbox that exposes process.env
// at runtime. The root tsconfig does not pull in @types/node (the browser
// app does not need it), so declare just the shape we use here.
declare const process: {
  env: Record<string, string | undefined>;
};
