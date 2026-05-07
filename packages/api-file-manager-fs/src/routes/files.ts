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
            const part = await request.file();
            if (!part) {
                return reply.code(400).send({ error: "No file part provided." });
            }

            const ext = part.filename.includes(".")
                ? part.filename.slice(part.filename.lastIndexOf("."))
                : "";
            const key = `${randomUUID()}${ext}`;

            await storage.write(key, part.file);

            const stats = await storage.stat(key);
            return reply.send({
                key,
                name: part.filename,
                type: part.mimetype,
                size: stats?.size ?? 0
            });
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
