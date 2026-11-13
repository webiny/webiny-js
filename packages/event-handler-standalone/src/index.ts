/*
 * The Node HTTP transport lives in `@webiny/event-handler-core/nodeHttp`, so AWS's Lambda web function
 * can use it without depending on this package. It is re-exported here for standalone projects.
 */
export * from "@webiny/event-handler-core/nodeHttp/index.js";
export { ProcessOwner } from "./process/ProcessOwner.js";
export { RandomProcessOwner } from "./process/RandomProcessOwner.js";
