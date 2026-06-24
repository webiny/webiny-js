import { promises as fs } from "node:fs";
import { Result } from "@webiny/feature/api";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetFileContentsByKeyUseCase } from "@webiny/api-file-manager/features/file/GetFileContentsByKey/index.js";
import type { FileContents } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import {
    FileNotFoundError,
    FilePersistenceError
} from "@webiny/api-file-manager/domain/file/errors.js";

const CONTENT_TYPE_MAP: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    bmp: "image/bmp",
    tiff: "image/tiff",
    tif: "image/tiff",
    pdf: "application/pdf",
    json: "application/json",
    xml: "application/xml",
    zip: "application/zip",
    gz: "application/gzip",
    txt: "text/plain",
    html: "text/html",
    htm: "text/html",
    css: "text/css",
    js: "application/javascript",
    ts: "application/typescript",
    mp4: "video/mp4",
    webm: "video/webm",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg"
};

function resolveContentType(key: string): string {
    const ext = key.split(".").pop()?.toLowerCase();
    if (!ext) {
        return "application/octet-stream";
    }
    return CONTENT_TYPE_MAP[ext] ?? "application/octet-stream";
}

class GetFileContentsByKeyUseCaseImpl implements GetFileContentsByKeyUseCase.Interface {
    constructor(private readonly tenantContext: TenantContext.Interface) {}

    async execute(key: string): Promise<Result<FileContents, GetFileContentsByKeyUseCase.Error>> {
        const tenant = this.tenantContext.getTenant();
        const bucketKey = `tenants/${tenant.id}/files/${key}`;
        const storagePath = String(process.env.WEBINY_LOCAL_STORAGE_PATH);
        const filePath = `${storagePath}/${bucketKey}`;

        try {
            const buffer = await fs.readFile(filePath);
            const contentType = resolveContentType(key);
            return Result.ok({ buffer, contentType });
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                return Result.fail(new FileNotFoundError(key));
            }
            return Result.fail(
                new FilePersistenceError(error instanceof Error ? error : new Error(String(error)))
            );
        }
    }
}

export const GetFileContentsByKeyUseCaseImplementation =
    GetFileContentsByKeyUseCase.createImplementation({
        implementation: GetFileContentsByKeyUseCaseImpl,
        dependencies: [TenantContext]
    });
