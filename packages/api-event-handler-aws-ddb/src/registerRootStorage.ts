import type { CreateWebinyApiHandlerConfig as BaseConfig } from "@webiny/api-event-handler-aws";
import { ApiCoreDdbFeature } from "@webiny/api-core-ddb";
import { HeadlessCmsDdbFeature } from "@webiny/api-headless-cms-ddb";
import { AuditLogsDdbFeature } from "@webiny/api-audit-logs-ddb";
import { AcoDdbFeature } from "@webiny/api-aco-ddb";
import { WebsocketsDdbFeature } from "@webiny/api-websockets-aws";

/**
 * The DynamoDB storage wiring (core + CMS + audit-logs + ACO + websockets storage operations), shared
 * by the buffered, streaming and web function entry points.
 */
export const registerRootStorage: BaseConfig["registerRootStorage"] = (
    container,
    { documentClient }
) => {
    ApiCoreDdbFeature.register(container, { documentClient });
    HeadlessCmsDdbFeature.register(container);
    AuditLogsDdbFeature.register(container, {});
    AcoDdbFeature.register(container);
    WebsocketsDdbFeature.register(container);
};
