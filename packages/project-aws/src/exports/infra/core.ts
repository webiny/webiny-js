/*
 * Type-only, so it is erased from the built JavaScript and a project without @webiny/project-aws
 * still loads this entry point. In AWS projects it makes TypeScript load the Pulumi app types.
 */
export type { AwsPulumiTypes } from "~/abstractions/pulumiTypes.js";
