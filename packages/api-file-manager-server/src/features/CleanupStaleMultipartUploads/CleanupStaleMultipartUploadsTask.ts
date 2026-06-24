import { promises as fs } from "node:fs";
import path from "node:path";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface CleanupStaleMultipartUploadsInput {
    /* Reserved for future use. */
    noop?: boolean;
}

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

/* Returns directory entries or an empty array if the path does not exist. */
async function readdirSafe(dirPath: string): Promise<string[]> {
    try {
        return await fs.readdir(dirPath);
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
            return [];
        }
        throw err;
    }
}

class CleanupStaleMultipartUploadsTaskImpl implements TaskDefinition.Interface<CleanupStaleMultipartUploadsInput> {
    public readonly id = "fileManagerCleanupStaleMultipartUploads";
    public readonly title = "Clean up stale multipart upload directories";
    public readonly description =
        "Removes multipart upload directories that are older than 24 hours.";
    public readonly maxIterations = 1;
    public readonly isPrivate = true;
    public readonly databaseLogs = false;
    public readonly selfCleanup = ["onSuccess" as const, "onAbort" as const];

    public async run({
        controller
    }: TaskDefinition.RunParams<CleanupStaleMultipartUploadsInput>): Promise<
        TaskDefinition.Result<CleanupStaleMultipartUploadsInput>
    > {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const storagePath = String(process.env.WEBINY_LOCAL_STORAGE_PATH);
        const tenantsDir = path.join(storagePath, "tenants");
        const now = Date.now();

        const tenantDirs = await readdirSafe(tenantsDir);

        for (const tenantId of tenantDirs) {
            const multipartDir = path.join(tenantsDir, tenantId, "multipart");
            const uploadDirs = await readdirSafe(multipartDir);

            for (const uploadId of uploadDirs) {
                const uploadPath = path.join(multipartDir, uploadId);

                try {
                    const stat = await fs.stat(uploadPath);
                    const ageMs = now - stat.mtimeMs;

                    if (ageMs > STALE_THRESHOLD_MS) {
                        await fs.rm(uploadPath, { recursive: true, force: true });
                    }
                } catch (err) {
                    /* Skip entries that have already been removed or cannot be accessed. */
                    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
                        throw err;
                    }
                }
            }
        }

        return controller.response.done();
    }
}

export const CleanupStaleMultipartUploadsTaskDefinition = TaskDefinition.createImplementation({
    implementation: CleanupStaleMultipartUploadsTaskImpl,
    dependencies: []
});
