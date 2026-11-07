export { createWebinyApiHandler } from "./createWebinyApiHandler.js";
export type { CreateWebinyApiHandlerConfig } from "./createWebinyApiHandler.js";
// Moved to @webiny/api-event-handler-core, so the AWS web function handler can use them too.
export {
    NodeHttpIdentityLoaderDecorator,
    NodeHttpTenantLoaderDecorator,
    NodeHttpAssumePermissionsDecorator
} from "@webiny/api-event-handler-core";
