import path from "node:path";
import { mkdir } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { writeFile } from "node:fs/promises";
import { rm } from "node:fs/promises";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { CompleteMultiPartUploadUseCase } from "@webiny/api-file-manager/features/upload/CompleteMultiPartUpload/index.js";

class CompleteMultiPartUploadUseCaseImpl implements CompleteMultiPartUploadUseCase.Interface {
    public constructor(private readonly tenantContext: TenantContext.Interface) {}

    public async execute(params: CompleteMultiPartUploadUseCase.Params): Promise<void> {
        const { fileKey, uploadId } = params;
        const storagePath = String(process.env.WEBINY_LOCAL_STORAGE_PATH);
        const tenant = this.tenantContext.getTenant();

        assertNoTraversal(uploadId);
        for (const seg of fileKey.split(/[\\/]/)) {
            assertNoTraversal(seg);
        }

        const tenantRoot = path.resolve(path.join(storagePath, "tenants", tenant.id, "files"));
        const destPath = path.resolve(path.join(tenantRoot, fileKey));
        assertPathContained(destPath, tenantRoot);

        const multipartDir = path.join(storagePath, "tenants", tenant.id, "multipart", uploadId);

        const entries = await readdir(multipartDir);
        const sorted = entries
            .filter(name => name.startsWith("part-"))
            .sort((a, b) => {
                const numA = parseInt(a.replace("part-", ""), 10);
                const numB = parseInt(b.replace("part-", ""), 10);
                return numA - numB;
            });

        const destDir = path.dirname(destPath);
        await mkdir(destDir, { recursive: true });

        const buffers: Buffer[] = [];
        for (const partName of sorted) {
            const partPath = path.join(multipartDir, partName);
            const partData = await readFile(partPath);
            buffers.push(partData);
        }

        const finalBuffer = Buffer.concat(buffers);
        await writeFile(destPath, finalBuffer);

        await rm(multipartDir, { recursive: true, force: true });
    }
}

function assertNoTraversal(segment: string): void {
    if (segment.includes("..") || segment.includes("/") || segment.includes("\\")) {
        throw new Error("Invalid path segment.");
    }
}

function assertPathContained(resolved: string, root: string): void {
    const normalized = path.resolve(resolved);
    const normalizedRoot = path.resolve(root);
    if (!normalized.startsWith(normalizedRoot + path.sep) && normalized !== normalizedRoot) {
        throw new Error("Path escapes tenant root.");
    }
}

export const CompleteMultiPartUploadUseCaseImplementation =
    CompleteMultiPartUploadUseCase.createImplementation({
        implementation: CompleteMultiPartUploadUseCaseImpl,
        dependencies: [TenantContext]
    });
