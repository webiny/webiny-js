import type { Container } from "@webiny/di";
import type { registerExtensions } from "@webiny/handler";

/**
 * The transport-agnostic half of a Webiny AWS Lambda composition root, shared by the buffered API
 * Gateway handler (`createWebinyApiHandler`) and the response-streaming Function URL handler
 * (`createWebinyStreamApiHandler`) so the two cannot drift on storage, identity providers, or the
 * per-request feature stack.
 *
 * The base assumes no database. The storage variant registers its database, and everything
 * built on it, in `registerRootStorage`.
 */
export interface WebinyApiCompositionConfig {
    /**
     * Project-defined extensions, applied at register() time. This is the one project-specific
     * input; everything else is standard AWS/env wiring owned by this package.
     */
    extensions: () => Parameters<typeof registerExtensions>[1];
    /**
     * Register the storage-variant features in the ROOT container: the database client, the CMS
     * storage operations, the storage registries, and (for the OpenSearch variant) the OpenSearch
     * core. Supplied by the variant package.
     */
    registerRootStorage: (container: Container) => void | Promise<void>;
}
