import type { Container } from "@webiny/di";
import { KernelExecutionId } from "@webiny/api-kernel-core";
import { GraphQLSchemaCacheFeature } from "@webiny/api-graphql";
import { EncryptionKeyCacheFeature } from "@webiny/api-core/features/encryption/index.js";
import { JwksStoreFeature } from "@webiny/api-core/idp/index.js";
import { ApiRequestRegistration, createLogger } from "@webiny/api-composition-core";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { pinoLambdaDestination } from "pino-lambda";
import { StructuredLogFormatter } from "pino-lambda";
import type { WebinyApiCompositionConfig } from "./types.js";
import { registerWebinyApiInOneContainer } from "./registerWebinyApiChild.js";
import { TenantScopesRootFeature } from "@webiny/api-core/features/tenancy/TenantScopes/index.js";

/**
 * ROOT container registration that is not transport-specific: logger, caches, and the storage
 * variant (which brings its own database). Shared by both AWS Lambda composition roots.
 */
export async function registerWebinyApiRoot(
    container: Container,
    config: WebinyApiCompositionConfig
): Promise<void> {
    // ── Logger ─────────────────────────────────────────────────
    // One per Lambda instance, in CloudWatch's structured format. Every request container inherits it.
    const formatter = new StructuredLogFormatter();
    const destination = pinoLambdaDestination({ formatter });
    /*
     * The formatter writes `awsRequestId` as the line's `requestId`. The execution id is the
     * invocation's request id (`context.awsRequestId` on a Lambda, the `lambda-web-request-id` header on
     * a web function). Read per line, not set per invocation as pino-lambda's `lambdaRequestTracker`
     * does: that keeps one id in a global, and a web function runs several requests at once.
     */
    const executionId = container.resolve(KernelExecutionId);
    const logger = createLogger(destination, () => {
        return { awsRequestId: executionId.getId() };
    });
    container.registerInstance(Logger, logger);

    // Identity providers are not registered here. Each one comes from its project extension (e.g.
    // `<Cognito/>` registers CognitoIdpFeature), which registers in the request container. The
    // request auth step resolves from that container after extensions have registered, so it sees
    // them.

    // ── GraphQL schema cache ───────────────────────────────────
    // Root, so a built schema outlives the request that built it: one build per Lambda instance
    // instead of one per request.
    GraphQLSchemaCacheFeature.register(container);

    // ── Encryption key cache ───────────────────────────────────
    // Root, so the scrypt-derived key is computed once per Lambda instance instead of per request.
    EncryptionKeyCacheFeature.register(container);
    // Root, so identity providers' signing keys are fetched once per process, not per request.
    JwksStoreFeature.register(container);

    // ── Tenant scopes ──────────────────────────────────────────
    // Every event's handler chain runs in its tenant's scope. The transport registers the
    // `InputTenantSource` that names the tenant of its requests (the `x-tenant` header).
    TenantScopesRootFeature.register(container);

    // ── Request registration ───────────────────────────────────
    // What a request has, in one container, for work outside a request that needs one: the SQL
    // schema setup builds one on its own connection.
    container.registerInstance(ApiRequestRegistration, {
        register: requestContainer => registerWebinyApiInOneContainer(requestContainer, config)
    });

    // ── Storage (variant-specific: database, CMS storage ops, registries, OpenSearch core) ──
    await config.registerRootStorage(container);
}
