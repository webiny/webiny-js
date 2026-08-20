import type { Container } from "@webiny/di";
import { registerApiRequestStack } from "@webiny/api-event-handler-core";
import { WebsocketsAwsFeature } from "@webiny/api-websockets-aws";
import { SchedulerAwsFeature } from "@webiny/api-scheduler-aws";
import { FileManagerS3Feature } from "@webiny/api-file-manager-s3";
import type { WebinyApiCompositionConfig } from "./types.js";

/**
 * The per-request feature stack, which is transport-agnostic (shared with the server transport).
 * The AWS-specific interleave points are supplied as the `transports` adapters.
 */
export async function registerWebinyApiRequest(
    container: Container,
    config: WebinyApiCompositionConfig
): Promise<void> {
    await registerApiRequestStack(container, {
        extensions: config.extensions,
        registerRequestStorage: config.registerRequestStorage,
        transports: {
            // Real AWS WebSocket transport (API Gateway Management API), registered right after
            // WebsocketsFeature so it overrides the NullWebsocketsTransport.
            realtime: c => {
                WebsocketsAwsFeature.register(c);
            },
            // Scheduler transport: the scheduler-aws extension (EventBridge Scheduler).
            scheduler: c => {
                SchedulerAwsFeature.register(c);
            },
            // File-manager storage transport: S3 (asset delivery + S3 file operations + schema).
            fileManager: c => {
                FileManagerS3Feature.register(c, {});
            }
        }
    });
}
