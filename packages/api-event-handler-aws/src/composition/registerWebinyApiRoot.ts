import type { Container } from "@webiny/di";
import type { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { DynamoDBCoreFeature } from "@webiny/db-dynamodb";
import { GraphQLSchemaCacheFeature } from "@webiny/api-graphql";
import { EncryptionKeyCacheFeature } from "@webiny/api-core/features/encryption/index.js";
import { JwksStoreFeature } from "@webiny/api-core/idp/index.js";
// CognitoIdpFeature must be in the root container so the request auth step
// (identity loader decorator → RequestIdentityLoader) sees CognitoIdentityProvider when it is first
// instantiated. Extensions register in the child/request container — too late.
import { CognitoIdpFeature } from "@webiny/cognito/api/features/CognitoIdp/feature.js";
import type { WebinyApiCompositionConfig } from "./types.js";

/**
 * ROOT container registration that is not transport-specific: database, identity providers, and the
 * storage variant. Shared by both AWS Lambda composition roots.
 */
export async function registerWebinyApiRoot(
    container: Container,
    config: WebinyApiCompositionConfig,
    documentClient: ReturnType<typeof getDocumentClient>
): Promise<void> {
    // ── Database ───────────────────────────────────────────────
    DynamoDBCoreFeature.register(container, { documentClient });

    // ── Identity providers ─────────────────────────────────────
    // Must be in root so the request auth step can authenticate requests before the GraphQL engine
    // runs.
    CognitoIdpFeature.register(container);

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
