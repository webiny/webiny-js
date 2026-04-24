/**
 * @cloudi/aws - DI-enabled cloud (AWS Lambda) functions
 *
 * Write cloud (AWS Lambda) functions using Dependency Injection.
 */

export { createFunction } from "./createFunction.js";
export type { FunctionSetup, FunctionHandler, NextFunction } from "./types.js";

export * from "./abstractions/index.js";

export { Container, Abstraction } from "@webiny/di";
