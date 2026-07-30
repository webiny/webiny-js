/**
 * Registration shared by the two AWS Lambda composition roots — the buffered API Gateway handler
 * (`createWebinyApiHandler`) and the response-streaming Function URL handler
 * (`createWebinyStreamApiHandler`).
 *
 * Everything that is NOT transport-specific lives here, so the two entry points cannot drift on
 * storage, identity providers, or the per-request feature stack.
 */
import type { Container } from "@webiny/di";
import type { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { registerExtensions } from "@webiny/handler";
import { DynamoDBCoreFeature } from "@webiny/db-dynamodb";
import { registerApiRequestStack } from "@webiny/api-event-handler-core";
import { WebsocketsAwsFeature } from "@webiny/api-websockets-aws";
import { SchedulerAwsFeature } from "@webiny/api-scheduler-aws";
import { FileManagerS3Feature } from "@webiny/api-file-manager-s3";
// CognitoIdpFeature must be in the root container so the request auth step
// (identity loader decorator → RequestIdentityLoader) sees CognitoIdentityProvider when it is first
// instantiated. Extensions register in the child/request container — too late.
import { CognitoIdpFeature } from "@webiny/cognito/api/features/CognitoIdp/feature.js";

export interface RegisterRootStorageContext {
    documentClient: ReturnType<typeof getDocumentClient>;
}

export interface WebinyApiCompositionConfig {
    /**
     * Project-defined extensions, applied at register() time. This is the one project-specific
     * input; everything else is standard AWS/env wiring owned by this package.
     */
    extensions: () => Parameters<typeof registerExtensions>[1];
    /**
     * DynamoDB document client. Defaults to the standard AWS client (`getDocumentClient()`).
     * Injectable so integration tests can point the handler at a local (dynalite) DynamoDB.
     */
    documentClient?: ReturnType<typeof getDocumentClient>;
    /**
     * Register the storage-variant features in the ROOT container: the CMS storage operations, the
     * DDB storage registries, and (for the OpenSearch variant) the OpenSearch core. Supplied by the
     * variant package.
     */
    registerRootStorage: (
        container: Container,
        ctx: RegisterRootStorageContext
    ) => void | Promise<void>;
    /**
     * Register any request-phase storage features that must run BEFORE `HeadlessCmsFeature` builds
     * its storage — e.g. `DbRegistryFeature` for the DDB+ES variant. Optional (DDB-only needs none).
     */
    registerRequestStorage?: (container: Container) => void | Promise<void>;
}

/** Database, identity providers, and the storage variant. Transport-agnostic. */
export async function registerWebinyApiRoot(
    container: Container,
    config: WebinyApiCompositionConfig,
    documentClient: ReturnType<typeof getDocumentClient>
): Promise<void> {
    // ── Database ───────────────────────────────────────────────
    DynamoDBCoreFeature.register(container, { documentClient });

    // ── Identity providers ─────────────────────────────────────
    // Must be in root so the request auth step can authenticate
    // requests before the GraphQL engine runs.
    CognitoIdpFeature.register(container);

    // ── Storage (variant-specific: CMS storage ops, DDB registries, OpenSearch core) ──
    await config.registerRootStorage(container, { documentClient });
}

/**
 * The per-request feature stack, which is transport-agnostic (shared with the server transport). The
 * AWS-specific interleave points are supplied as the `transports` adapters.
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
