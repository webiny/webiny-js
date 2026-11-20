import path from "node:path";
import { mkdir } from "node:fs/promises";
import { open } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { rename } from "node:fs/promises";
import { rm } from "node:fs/promises";
import { rmdir } from "node:fs/promises";
import { stat } from "node:fs/promises";
import { writeFile } from "node:fs/promises";
import type { FileHandle } from "node:fs/promises";
import { createHash } from "node:crypto";
import { mdbid } from "@webiny/utils";
import { FileManagerStandaloneConfig } from "~/features/FileManagerStandaloneConfig/abstractions.js";
import { isValidObjectKey } from "~/utils/isValidObjectKey.js";
import { resolveStoragePath } from "~/utils/resolveStoragePath.js";
import { ObjectStorage } from "./abstractions.js";

// Multipart uploads in progress: `multipart/<uploadId>/key` holds the target key, `part-<n>` the parts.
const MULTIPART_FOLDER = "multipart";
const TARGET_KEY_FILE = "key";
const PART_FILE_PREFIX = "part-";
const UPLOAD_ID_PATTERN = /^[a-z0-9]+$/i;

const isMissing = (error: unknown): boolean => {
    return (error as NodeJS.ErrnoException)?.code === "ENOENT";
};

class DiskObjectStorageImpl implements ObjectStorage.Interface {
    private readonly root: string;

    public constructor(config: FileManagerStandaloneConfig.Interface) {
        if (config.storage.type !== "disk") {
            throw new Error(`DiskObjectStorage needs disk storage, got "${config.storage.type}".`);
        }
        this.root = config.storage.path;
    }

    public async put(key: string, body: Buffer): Promise<void> {
        const filePath = this.resolveKey(key);
        await mkdir(path.dirname(filePath), { recursive: true });
        await writeFile(filePath, body);
    }

    public async putIfAbsent(key: string, body: Buffer): Promise<boolean> {
        const filePath = this.resolveKey(key);
        await mkdir(path.dirname(filePath), { recursive: true });

        let handle: FileHandle;
        try {
            // "wx" fails with EEXIST instead of overwriting a file that's already there.
            handle = await open(filePath, "wx");
        } catch (error) {
            if ((error as NodeJS.ErrnoException)?.code === "EEXIST") {
                return false;
            }
            throw error;
        }

        // From here on the file is this call's: the exclusive open created it.
        try {
            await handle.writeFile(body);
        } catch (error) {
            // Partial bytes would block storing the key again.
            await handle.close().catch(() => undefined);
            await rm(filePath, { force: true }).catch(() => undefined);
            throw error;
        }
        await handle.close();
        return true;
    }

    public async get(key: string): Promise<Buffer | null> {
        const filePath = this.resolveKey(key);
        try {
            return await readFile(filePath);
        } catch (error) {
            if (isMissing(error)) {
                return null;
            }
            throw error;
        }
    }

    public async delete(key: string): Promise<void> {
        const filePath = this.resolveKey(key);
        await rm(filePath, { force: true });

        // Remove the file's folder (`<id>/`) when nothing else is in it.
        const folderPath = path.dirname(filePath);
        if (path.resolve(folderPath) !== path.resolve(this.root)) {
            await rmdir(folderPath).catch(() => undefined);
        }
    }

    public async deletePrefix(prefix: string): Promise<void> {
        if (!prefix.endsWith("/")) {
            throw new Error(`A prefix must end with "/": "${prefix}".`);
        }
        const folderPath = this.resolveKey(prefix.slice(0, -1));
        await rm(folderPath, { recursive: true, force: true });
    }

    public async createMultipartUpload(key: string): Promise<string> {
        this.resolveKey(key);
        const uploadId = mdbid();
        const uploadPath = this.resolveUploadPath(uploadId);
        await mkdir(uploadPath, { recursive: true });
        await writeFile(path.join(uploadPath, TARGET_KEY_FILE), key);
        return uploadId;
    }

    public async uploadPart(params: ObjectStorage.UploadPartParams): Promise<string> {
        const { key, uploadId, partNumber, body } = params;
        await this.assertUploadTarget(key, uploadId);

        const partPath = path.join(
            this.resolveUploadPath(uploadId),
            `${PART_FILE_PREFIX}${partNumber}`
        );
        await writeFile(partPath, body);
        return createHash("md5").update(body).digest("hex");
    }

    public async completeMultipartUpload(key: string, uploadId: string): Promise<void> {
        await this.assertUploadTarget(key, uploadId);

        const uploadPath = this.resolveUploadPath(uploadId);
        const entries = await readdir(uploadPath);
        const partNumbers = entries
            .filter(name => name.startsWith(PART_FILE_PREFIX))
            .map(name => Number(name.slice(PART_FILE_PREFIX.length)))
            .filter(partNumber => Number.isInteger(partNumber) && partNumber > 0)
            .sort((a, b) => a - b);
        if (partNumbers.length === 0) {
            throw new Error(`Multipart upload "${uploadId}" has no parts.`);
        }

        // Written next to the target and renamed into place, so a reader never sees half a file.
        const filePath = this.resolveKey(key);
        const temporaryPath = `${filePath}.${uploadId}.uploading`;
        await mkdir(path.dirname(filePath), { recursive: true });
        const handle = await open(temporaryPath, "w");
        try {
            for (const partNumber of partNumbers) {
                const partPath = path.join(uploadPath, `${PART_FILE_PREFIX}${partNumber}`);
                // oxlint-disable-next-line no-await-in-loop -- parts are appended in order.
                const part = await readFile(partPath);
                // oxlint-disable-next-line no-await-in-loop -- parts are appended in order.
                await handle.write(part);
            }
        } catch (error) {
            await handle.close().catch(() => undefined);
            await rm(temporaryPath, { force: true }).catch(() => undefined);
            throw error;
        }
        await handle.close();
        await rename(temporaryPath, filePath);
        await rm(uploadPath, { recursive: true, force: true });
    }

    public async abortMultipartUploadsStartedBefore(startedBefore: Date): Promise<number> {
        const uploadsPath = resolveStoragePath(this.root, MULTIPART_FOLDER);
        let uploadIds: string[];
        try {
            uploadIds = await readdir(uploadsPath);
        } catch (error) {
            if (isMissing(error)) {
                return 0;
            }
            throw error;
        }

        let aborted = 0;
        for (const uploadId of uploadIds) {
            if (!UPLOAD_ID_PATTERN.test(uploadId)) {
                continue;
            }
            const uploadPath = path.join(uploadsPath, uploadId);
            try {
                // oxlint-disable-next-line no-await-in-loop -- one folder at a time is enough here.
                const stats = await stat(uploadPath);
                if (stats.mtimeMs >= startedBefore.getTime()) {
                    continue;
                }
                // oxlint-disable-next-line no-await-in-loop -- one folder at a time is enough here.
                await rm(uploadPath, { recursive: true, force: true });
                aborted++;
            } catch (error) {
                // Removed meanwhile, by a completed upload or another process.
                if (!isMissing(error)) {
                    throw error;
                }
            }
        }
        return aborted;
    }

    private resolveKey(key: string): string {
        if (!isValidObjectKey(key)) {
            throw new Error(`Invalid storage key: "${key}".`);
        }
        return resolveStoragePath(this.root, key);
    }

    private resolveUploadPath(uploadId: string): string {
        if (!UPLOAD_ID_PATTERN.test(uploadId)) {
            throw new Error(`Invalid multipart upload ID: "${uploadId}".`);
        }
        return resolveStoragePath(this.root, MULTIPART_FOLDER, uploadId);
    }

    /* An upload is only ever completed into, or given parts for, the key it was started for. */
    private async assertUploadTarget(key: string, uploadId: string): Promise<void> {
        this.resolveKey(key);
        const keyPath = path.join(this.resolveUploadPath(uploadId), TARGET_KEY_FILE);
        let targetKey: string;
        try {
            targetKey = await readFile(keyPath, "utf8");
        } catch (error) {
            if (isMissing(error)) {
                throw new Error(`Multipart upload "${uploadId}" does not exist.`);
            }
            throw error;
        }
        if (targetKey !== key) {
            throw new Error(`Multipart upload "${uploadId}" was not started for "${key}".`);
        }
    }
}

export const DiskObjectStorage = ObjectStorage.createImplementation({
    implementation: DiskObjectStorageImpl,
    dependencies: [FileManagerStandaloneConfig]
});
