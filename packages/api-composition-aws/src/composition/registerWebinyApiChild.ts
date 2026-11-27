import type { Container } from "@webiny/di";
import {
    registerApiRequestStack,
    registerApiRequestStackInOneContainer,
    type RegisterApiRequestStackConfig
} from "@webiny/api-composition-core";
import { WebsocketsAwsFeature } from "@webiny/api-websockets-aws";
import { SchedulerAwsFeature } from "@webiny/api-scheduler-aws";
import { FileManagerS3Feature } from "@webiny/api-file-manager-s3";
import { ManifestPublicUrlsFeature } from "~/publicUrls/feature.js";
import { CloudFrontCdnCacheFeature } from "~/cdnCache/feature.js";
import type { WebinyApiCompositionConfig } from "./types.js";

/**
 * The transport-agnostic feature stack (shared with the server transport), with the AWS-specific
 * interleave points supplied as the `transports` adapters.
 */
function createStackConfig(config: WebinyApiCompositionConfig): RegisterApiRequestStackConfig {
    return {
        extensions: config.extensions,
        transports: {
            // Public URLs: written to the service manifest by the `api` and `admin` Pulumi apps.
            // CDN cache: the API's CloudFront distribution, invalidated through a background task.
            // Encryption and hashing keep api-core's build-param defaults.
            hostingConfig: c => {
                ManifestPublicUrlsFeature.register(c);
                CloudFrontCdnCacheFeature.register(c);
            },
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
    };
}

/**
 * Sets up the per-request CHILD container: its tenant-neutral part, and how each tenant scope of
 * the request is registered (the feature stack).
 *
 * Named for the `child` lifecycle step of `KernelConfig`, not "request", so it matches the contract
 * it implements.
 */
export async function registerWebinyApiChild(
    container: Container,
    config: WebinyApiCompositionConfig
): Promise<void> {
    await registerApiRequestStack(container, createStackConfig(config));
}

/**
 * The whole request stack in one container, without a tenant: for work outside a request (the SQL
 * schema setup).
 */
export async function registerWebinyApiInOneContainer(
    container: Container,
    config: WebinyApiCompositionConfig
): Promise<void> {
    await registerApiRequestStackInOneContainer(container, createStackConfig(config));
}
