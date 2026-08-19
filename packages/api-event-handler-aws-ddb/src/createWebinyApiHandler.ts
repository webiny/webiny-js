/**
 * Webiny API handler for AWS Lambda with DynamoDB storage.
 *
 * Thin variant over the storage-agnostic base (@webiny/api-event-handler-aws): supplies the DynamoDB
 * storage wiring (core + CMS + audit-logs + ACO + websockets storage operations). No OpenSearch.
 */
import {
    createWebinyApiHandler as createBaseHandler,
    type CreateWebinyApiHandlerConfig as BaseConfig
} from "@webiny/api-event-handler-aws";
import { ApiCoreDdbFeature } from "@webiny/api-core-ddb";
import { HeadlessCmsDdbFeature } from "@webiny/api-headless-cms-ddb";
import { AuditLogsDdbFeature } from "@webiny/api-audit-logs-ddb";
import { AcoDdbFeature } from "@webiny/api-aco-ddb";
import { WebsocketsDdbFeature } from "@webiny/api-websockets-aws";

export type CreateAwsDdbApiHandlerConfig = Pick<BaseConfig, "extensions" | "documentClient">;

export function createAwsDdbApiHandler(config: CreateAwsDdbApiHandlerConfig) {
    return createBaseHandler({
        ...config,
        registerRootStorage: (container, { documentClient }) => {
            ApiCoreDdbFeature.register(container, { documentClient });
            HeadlessCmsDdbFeature.register(container);
            AuditLogsDdbFeature.register(container, {});
            AcoDdbFeature.register(container);
            WebsocketsDdbFeature.register(container);
        }
    });
}
