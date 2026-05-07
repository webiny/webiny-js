import { ContextPlugin } from "@webiny/api";
import type { FileManagerFsConfig } from "./types.js";
import { FsFileStorage } from "./storage.js";
import { createFileRoutesPlugins } from "./routes/files.js";
import { createFsGraphQLSchema } from "./graphql/schema.js";

const DEFAULT_ROUTES_PREFIX = "/files";

/**
 * Container-mode equivalent of `createFileManagerS3()`.
 *
 * Returns a plugin set that:
 *   - mounts byte upload + download routes on the API server,
 *   - extends the FmQuery GraphQL schema with `getPreSignedPostPayload`
 *     pointing at the local upload route (Admin UI compatibility),
 *   - eagerly creates the upload directory on first boot.
 *
 * Out of scope for stage 7: multi-part uploads, asset-delivery CDN,
 * Sharp transforms / thumbnails, threat detection. The S3 path covers
 * those; the container path adds them as needed in follow-on work.
 */
export const createFileManagerFs = (config: FileManagerFsConfig) => {
    const routesPrefix =
        (config.routesPrefix ?? DEFAULT_ROUTES_PREFIX).replace(/\/+$/, "") || "/files";
    const baseUrl = config.baseUrl ?? "";
    const uploadUrl = `${baseUrl}${routesPrefix}/upload`;
    const downloadBase = `${baseUrl}${routesPrefix}`;

    const storage = new FsFileStorage(config.uploadDir);

    const contextPlugin = new ContextPlugin(_context => {
        // Reserved for DI registrations (e.g., FileUrlGenerator) once the
        // file-manager core surfaces a non-S3-coupled URL generator hook.
        // Stage 7 ships routes + GraphQL only — sufficient to upload/render.
    });
    contextPlugin.name = "fileManagerFs.context";

    return [
        contextPlugin,
        ...createFileRoutesPlugins({ storage, routesPrefix }),
        createFsGraphQLSchema({ uploadUrl, baseUrl: downloadBase })
    ];
};
