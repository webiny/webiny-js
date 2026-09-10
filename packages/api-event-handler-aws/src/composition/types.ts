import type { Container } from "@webiny/di";
import type { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { registerExtensions } from "@webiny/handler";

export interface RegisterRootStorageContext {
    documentClient: ReturnType<typeof getDocumentClient>;
}

/**
 * The transport-agnostic half of a Webiny AWS Lambda composition root, shared by the buffered API
 * Gateway handler (`createWebinyApiHandler`) and the response-streaming Function URL handler
 * (`createWebinyStreamApiHandler`) so the two cannot drift on storage, identity providers, or the
 * per-request feature stack.
 */
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
