import path from "node:path";
import { mkdir, open, rm, rmdir } from "node:fs/promises";
import type { FileHandle } from "node:fs/promises";
import { Result } from "@webiny/feature/api";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { FileContentsStorage } from "@webiny/api-file-manager/features/file/FileContentsStorage/index.js";
import {
    FileAlreadyExistsError,
    FilePersistenceError
} from "@webiny/api-file-manager/domain/file/errors.js";
import { FileManagerStandaloneConfig } from "~/features/FileManagerStandaloneConfig/abstractions.js";
import { resolveStoragePath } from "~/utils/resolveStoragePath.js";

const toPersistenceError = (error: unknown) => {
    return new FilePersistenceError(error instanceof Error ? error : new Error(String(error)));
};

class DiskFileContentsStorageImpl implements FileContentsStorage.Interface {
    constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly config: FileManagerStandaloneConfig.Interface
    ) {}

    async put(
        input: FileContentsStorage.PutInput
    ): Promise<Result<void, FileContentsStorage.PutError>> {
        let filePath: string;
        let handle: FileHandle;
        try {
            filePath = this.resolvePaths(input.key).filePath;

            await mkdir(path.dirname(filePath), { recursive: true });
            // "wx" fails with EEXIST instead of overwriting a file that's already there.
            handle = await open(filePath, "wx");
        } catch (error) {
            if ((error as NodeJS.ErrnoException)?.code === "EEXIST") {
                return Result.fail(new FileAlreadyExistsError({ key: input.key }));
            }
            // The open failed, so this call created nothing: whatever is at the path isn't ours.
            return Result.fail(toPersistenceError(error));
        }

        // From here on the file is this call's: the exclusive open created it.
        let writeError: unknown;
        try {
            await handle.writeFile(input.contents);
        } catch (error) {
            writeError = error;
        } finally {
            await handle.close().catch(() => undefined);
        }

        if (writeError === undefined) {
            return Result.ok();
        }
        // A failed write leaves partial bytes behind, and they would block storing the key again.
        await rm(filePath, { force: true }).catch(() => undefined);
        return Result.fail(toPersistenceError(writeError));
    }

    async delete(key: string): Promise<Result<void, FileContentsStorage.DeleteError>> {
        try {
            const { filesPath, filePath } = this.resolvePaths(key);
            await rm(filePath, { force: true });

            // Remove the file's folder (`<id>/`) when nothing else is in it.
            const folderPath = path.dirname(filePath);
            if (folderPath !== filesPath) {
                await rmdir(folderPath).catch(() => undefined);
            }
            return Result.ok();
        } catch (error) {
            return Result.fail(toPersistenceError(error));
        }
    }

    /**
     * The key must stay inside the current tenant's files folder: `resolveStoragePath` throws otherwise.
     */
    private resolvePaths(key: string) {
        const tenant = this.tenantContext.getTenant();
        const filesPath = resolveStoragePath(
            this.config.storagePath,
            "tenants",
            tenant.id,
            "files"
        );
        return { filesPath, filePath: resolveStoragePath(filesPath, key) };
    }
}

export const DiskFileContentsStorage = FileContentsStorage.createImplementation({
    implementation: DiskFileContentsStorageImpl,
    dependencies: [TenantContext, FileManagerStandaloneConfig]
});
