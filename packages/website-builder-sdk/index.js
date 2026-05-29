// Dev-only proxy for symlinked monorepo packages: when an external project
// (e.g. website-builder-nuxt) symlinks this package, Node resolves imports to
// this source root rather than dist/. This file forwards to the compiled output.
export * from "./dist/index.js";
