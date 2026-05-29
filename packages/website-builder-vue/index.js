// Dev-only proxy: forwards to the compiled dist so that workspace symlinks
// resolve correctly when the package is consumed by external Node.js runtimes
// (e.g. Nitro) that follow symlinks to this source root.
export * from "./dist/index.js";
