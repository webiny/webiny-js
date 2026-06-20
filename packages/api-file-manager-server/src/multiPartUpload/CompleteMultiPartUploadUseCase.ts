import path from "node:path";
import { mkdir } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { rm } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

interface CompleteMultiPartUploadParams {
    fileKey: string;
    uploadId: string;
    tenantId: string;
}

export class CompleteMultiPartUploadUseCase {
    private readonly storagePath: string;

    public constructor(storagePath: string) {
        this.storagePath = storagePath;
    }

    public async execute(params: CompleteMultiPartUploadParams): Promise<void> {
        const { fileKey, uploadId, tenantId } = params;

        this.assertNoTraversal(uploadId);
        this.assertPathContained(path.join(this.storagePath, fileKey));

        const multipartDir = path.join(
            this.storagePath,
            "tenants",
            tenantId,
            "multipart",
            uploadId
        );

        const entries = await readdir(multipartDir);

        const sorted = entries
            .filter(name => name.startsWith("part-"))
            .sort((a, b) => {
                const numA = parseInt(a.replace("part-", ""), 10);
                const numB = parseInt(b.replace("part-", ""), 10);
                return numA - numB;
            });

        const destPath = path.join(this.storagePath, fileKey);
        const destDir = path.dirname(destPath);

        await mkdir(destDir, { recursive: true });

        const destStream = createWriteStream(destPath);

        for (const partName of sorted) {
            const partPath = path.join(multipartDir, partName);
            const partData = await readFile(partPath);
            const readable = Readable.from(partData);
            await pipeline(readable, destStream, { end: false });
        }

        destStream.end();

        await new Promise<void>((resolve, reject) => {
            destStream.on("finish", resolve);
            destStream.on("error", reject);
        });

        await rm(multipartDir, { recursive: true, force: true });
    }

    private assertNoTraversal(segment: string): void {
        if (segment.includes("..") || segment.includes("/") || segment.includes("\\")) {
            throw new Error("Invalid path segment.");
        }
    }

    private assertPathContained(resolved: string): void {
        const normalized = path.resolve(resolved);
        const root = path.resolve(this.storagePath);
        if (!normalized.startsWith(root + path.sep) && normalized !== root) {
            throw new Error("Path escapes storage root.");
        }
    }
}
