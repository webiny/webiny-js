import type { Container } from "@webiny/di";
import { GraphQLSchemaCacheFeature } from "@webiny/api-graphql";
import { EncryptionKeyCacheFeature } from "@webiny/api-core/features/encryption/index.js";
import { JwksStoreFeature } from "@webiny/api-core/idp/index.js";
import { createLogger } from "@webiny/api-event-handler-core";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { pinoLambdaDestination } from "pino-lambda";
import { StructuredLogFormatter } from "pino-lambda";
import type { WebinyApiCompositionConfig } from "./types.js";

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
    const logger = createLogger(destination);
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

    // ── Storage (variant-specific: database, CMS storage ops, registries, OpenSearch core) ──
    await config.registerRootStorage(container);
}
