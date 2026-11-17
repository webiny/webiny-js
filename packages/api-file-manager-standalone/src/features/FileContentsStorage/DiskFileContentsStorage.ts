import path from "node:path";
import { mkdir, rm, rmdir, writeFile } from "node:fs/promises";
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
        let filePath: string | undefined;
        try {
            filePath = this.resolvePaths(input.key).filePath;

            await mkdir(path.dirname(filePath), { recursive: true });
            // "wx" fails with EEXIST instead of overwriting a file that's already there.
            await writeFile(filePath, input.contents, { flag: "wx" });
            return Result.ok();
        } catch (error) {
            if ((error as NodeJS.ErrnoException)?.code === "EEXIST") {
                return Result.fail(new FileAlreadyExistsError({ key: input.key }));
            }
            // "wx" creates the file before writing any bytes, so a failed write leaves a
            // partial file behind, and it would block storing the key again. The file can't
            // be someone else's: "wx" fails with EEXIST when the file is already there.
            if (filePath) {
                await rm(filePath, { force: true }).catch(() => undefined);
            }
            return Result.fail(toPersistenceError(error));
        }
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
