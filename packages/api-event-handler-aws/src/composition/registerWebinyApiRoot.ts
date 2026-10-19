import type { Container } from "@webiny/di";
import type { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { DynamoDBCoreFeature } from "@webiny/db-dynamodb";
import { GraphQLSchemaCacheFeature } from "@webiny/api-graphql";
import { EncryptionKeyCacheFeature } from "@webiny/api-core/features/encryption/index.js";
import { JwksStoreFeature } from "@webiny/api-core/idp/index.js";
import type { WebinyApiCompositionConfig } from "./types.js";

/**
 * ROOT container registration that is not transport-specific: database, caches, and the storage
 * variant. Shared by both AWS Lambda composition roots.
 */
export async function registerWebinyApiRoot(
    container: Container,
    config: WebinyApiCompositionConfig,
    documentClient: ReturnType<typeof getDocumentClient>
): Promise<void> {
    // ── Database ───────────────────────────────────────────────
    DynamoDBCoreFeature.register(container, { documentClient });

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

    // ── Storage (variant-specific: CMS storage ops, DDB registries, OpenSearch core) ──
    await config.registerRootStorage(container, { documentClient });
}
