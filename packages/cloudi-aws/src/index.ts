/**
 * @cloudi/aws - DI-enabled cloud (AWS Lambda) functions
 *
 * Write cloud (AWS Lambda) functions using Dependency Injection.
 */

// Core
export { createFunction, type ICloudFunction } from "./createFunction.js";
export type { FunctionSetup, FunctionHandler, CreateFunctionOptions } from "./types.js";

// Abstractions
export * from "./abstractions/index.js";

// Re-export Container and Abstraction from @webiny/di for convenience
export { Container, Abstraction } from "@webiny/di";


