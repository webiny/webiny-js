import { ModifyFastifyPlugin, RoutePlugin } from "@webiny/handler";
import multipart from "@fastify/multipart";
import { randomUUID } from "node:crypto";
import type { FsFileStorage } from "~/storage.js";

export interface CreateFileRoutesPluginsParams {
    storage: FsFileStorage;
    routesPrefix: string;
}

/**
 * Three plugins:
 *   1. ModifyFastifyPlugin — registers `@fastify/multipart` so the upload
 *      route can stream files efficiently without buffering them in memory.
 *   2. RoutePlugin — POST `${prefix}/upload` accepts a single file part,
 *      writes it to disk under a generated key, returns `{ key, name, size,
 *      type }`. The S3 path uses presigned-POST URLs to get the same effect;
 *      this is the FS equivalent.
 *   3. RoutePlugin — GET `${prefix}/:key` streams the file back. Used by
 *      both browsers viewing assets and clients downloading them.
 */
export const createFileRoutesPlugins = (params: CreateFileRoutesPluginsParams) => {
    const { storage, routesPrefix } = params;

    const installMultipart = new ModifyFastifyPlugin(app => {
        app.register(multipart, {
            limits: {
                // 256 MB — well above what the API would handle in a single
                // upload before the user would split into multipart on the
                // S3 path. Tunable via env var if needed.
                fileSize: 256 * 1024 * 1024
            }
        });
    });
    installMultipart.name = "fileManagerFs.multipart";

    const uploadRoute = new RoutePlugin(({ onPost }) => {
        onPost(`${routesPrefix}/upload` as `/${string}`, async (request, reply) => {
            // Mirrors S3's pre-signed POST: getPreSignedPostPayload
            // chooses the storage key and returns it as a `key` form
            // field; the browser appends every form field before the file
            // part. Stream the parts in order, capture the `key` field
            // first, then write the file under that key. Falling back to
            // a fresh UUID keeps direct (non-pre-signed) uploads working.
            let presignedKey: string | undefined;
            let writtenKey: string | undefined;
            let written: { name: string; type: string; size: number } | undefined;

            for await (const part of request.parts()) {
                if (part.type === "field" && part.fieldname === "key") {
                    const v = part.value;
                    presignedKey = typeof v === "string" ? v : undefined;
                    continue;
                }
                if (part.type === "file") {
                    const ext = part.filename.includes(".")
                        ? part.filename.slice(part.filename.lastIndexOf("."))
                        : "";
                    const key = presignedKey ?? `${randomUUID()}${ext}`;
                    await storage.write(key, part.file);
                    const stats = await storage.stat(key);
                    writtenKey = key;
                    written = {
                        name: part.filename,
                        type: part.mimetype,
                        size: stats?.size ?? 0
                    };
                    // Webiny's Admin UI uploads one file per request.
                    break;
                }
            }

            if (!writtenKey || !written) {
                return reply.code(400).send({ error: "No file part provided." });
            }

            // 204 No Content matches S3's pre-signed POST response.
            // app-file-manager-s3's SimpleUploadStrategy hard-codes a
            // `xhr.status === 204` success check (it already has the
            // file metadata from the GraphQL pre-sign step), so any
            // 200-with-body would be treated as failure by the Admin UI.
            return reply.code(204).send();
        });
    });
    uploadRoute.name = "fileManagerFs.upload";

    const downloadRoute = new RoutePlugin(({ onGet }) => {
        onGet(`${routesPrefix}/:key` as `/${string}`, async (request, reply) => {
            const { key } = request.params as { key: string };
            const stats = await storage.stat(key);
            if (!stats) {
                return reply.code(404).send({ error: "Not found." });
            }
            return reply.header("content-length", stats.size).send(storage.openReadStream(key));
        });
    });
    downloadRoute.name = "fileManagerFs.download";

    return [installMultipart, uploadRoute, downloadRoute];
};
