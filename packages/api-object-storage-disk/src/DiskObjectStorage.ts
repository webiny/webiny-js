import path from "node:path";
import { link } from "node:fs/promises";
import { mkdir } from "node:fs/promises";
import { open } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { rename } from "node:fs/promises";
import { rm } from "node:fs/promises";
import { rmdir } from "node:fs/promises";
import { stat } from "node:fs/promises";
import { writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { mdbid } from "@webiny/utils";
import { isValidObjectKey } from "@webiny/api-object-storage";
import { ObjectStorage } from "@webiny/api-object-storage";
import { resolveStoragePath } from "./resolveStoragePath.js";
import { DiskStorageConfig } from "./abstractions.js";

/*
 * Multipart uploads in progress: `.multipart/<uploadId>/key` holds the target key and is written
 * when the upload starts, `part-<n>` the parts. A key's first segment can't start with `.`
 * (`isValidObjectKey`), so no object key reaches this folder.
 */
const MULTIPART_FOLDER = ".multipart";
const TARGET_KEY_FILE = "key";
const PART_FILE_PREFIX = "part-";
const UPLOAD_ID_PATTERN = /^[a-z0-9]+$/i;

const errorCode = (error: unknown): string | undefined => {
    if (error instanceof Error && "code" in error && typeof error.code === "string") {
        return error.code;
    }
    return undefined;
};

const isMissing = (error: unknown): boolean => {
    return errorCode(error) === "ENOENT";
};

/*
 * Nothing is stored under a key whose path is a folder: it only holds other keys, as a prefix does
 * in a bucket.
 */
const isFolder = (error: unknown): boolean => {
    return errorCode(error) === "EISDIR";
};

/* A path next to `filePath`, for writing a file before it is moved or linked into place. */
const temporaryPathFor = (filePath: string): string => {
    const suffix = mdbid();
    return `${filePath}.${suffix}.uploading`;
};

/*
 * Whether a folder holds a file at any depth. Removing an object can leave its empty folders
 * behind, and those hold nothing. A missing folder, or a file at the path, holds nothing either.
 */
const containsFile = async (folderPath: string): Promise<boolean> => {
    let entries;
    try {
        entries = await readdir(folderPath, { withFileTypes: true });
    } catch (error) {
        if (isMissing(error) || errorCode(error) === "ENOTDIR") {
            return false;
        }
        throw error;
    }
    for (const entry of entries) {
        if (entry.isFile()) {
            return true;
        }
    }
    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue;
        }
        const entryPath = path.join(folderPath, entry.name);
        // oxlint-disable-next-line no-await-in-loop -- stops at the first folder with a file.
        if (await containsFile(entryPath)) {
            return true;
        }
    }
    return false;
};

const ensureParentFolder = async (filePath: string): Promise<void> => {
    const folderPath = path.dirname(filePath);
    await mkdir(folderPath, { recursive: true });
};

class DiskObjectStorageImpl implements ObjectStorage.Interface {
    private readonly root: string;

    public constructor(config: DiskStorageConfig.Interface) {
        this.root = config.path;
    }

    public async put(key: string, body: Buffer): Promise<void> {
        const filePath = this.resolveKey(key);
        await ensureParentFolder(filePath);
        await writeFile(filePath, body);
    }

    public async putIfAbsent(key: string, body: Buffer): Promise<boolean> {
        const filePath = this.resolveKey(key);
        await ensureParentFolder(filePath);

        /*
         * Written in full to a temporary file and then hard-linked to the key, so a reader never
         * sees half a file, and the link fails with EEXIST when the key is taken.
         */
        const temporaryPath = temporaryPathFor(filePath);
        try {
            const handle = await open(temporaryPath, "wx");
            try {
                await handle.writeFile(body);
            } finally {
                await handle.close();
            }
            await link(temporaryPath, filePath);
            return true;
        } catch (error) {
            if (errorCode(error) === "EEXIST") {
                return false;
            }
            throw error;
        } finally {
            await rm(temporaryPath, { force: true });
        }
    }

    public async get(key: string): Promise<Buffer | null> {
        const filePath = this.resolveKey(key);
        try {
            return await readFile(filePath);
        } catch (error) {
            if (isMissing(error) || isFolder(error)) {
                return null;
            }
            throw error;
        }
    }

    public async getStream(key: string): Promise<AsyncIterable<Uint8Array> | null> {
        const filePath = this.resolveKey(key);
        /*
         * Opened here, not by `createReadStream(path)`, which only opens the file once the consumer
         * starts reading: by then the response has started, and a missing file would be an error
         * in the middle of it. Opening reads no bytes; it only checks the file is there and gives
         * back a handle (a file descriptor) to read it through.
         */
        let handle;
        try {
            handle = await open(filePath, "r");
        } catch (error) {
            if (isMissing(error) || isFolder(error)) {
                return null;
            }
            throw error;
        }

        /*
         * A process can hold only so many open files (`ulimit -n`, shared with its sockets), and a
         * handle that is never closed stays taken until the process exits. So every way out of
         * here before the stream takes the handle over closes it.
         */
        try {
            // macOS and Linux open a folder for reading without an error, so check again.
            const stats = await handle.stat();
            if (stats.isDirectory()) {
                await handle.close();
                return null;
            }
            /*
             * Reads 64 KB at a time, only as fast as the consumer pulls. From here the stream owns
             * the handle and closes it when it ends or is destroyed (the client disconnected).
             */
            return handle.createReadStream();
        } catch (error) {
            await handle.close();
            throw error;
        }
    }

    public async delete(key: string): Promise<void> {
        const filePath = this.resolveKey(key);
        await rm(filePath, { force: true });

        // Remove the file's folder (`<id>/`) when nothing else is in it.
        const folderPath = path.dirname(filePath);
        const resolvedFolderPath = path.resolve(folderPath);
        const resolvedRoot = path.resolve(this.root);
        if (resolvedFolderPath !== resolvedRoot) {
            await rmdir(folderPath).catch(() => undefined);
        }
    }

    public async deletePrefix(prefix: string): Promise<void> {
        if (!prefix.endsWith("/")) {
            throw new Error(`A prefix must end with "/": "${prefix}".`);
        }
        const folderKey = prefix.slice(0, -1);
        const folderPath = this.resolveKey(folderKey);
        /*
         * Only a folder: an object stored at the key `a/b` is not under the prefix `a/b/`, and a
         * bucket would keep it too.
         */
        try {
            const stats = await stat(folderPath);
            if (!stats.isDirectory()) {
                return;
            }
        } catch (error) {
            if (isMissing(error)) {
                return;
            }
            throw error;
        }
        await rm(folderPath, { recursive: true, force: true });
    }

    public async hasPrefix(prefix: string): Promise<boolean> {
        if (!prefix.endsWith("/")) {
            throw new Error(`A prefix must end with "/": "${prefix}".`);
        }
        const folderKey = prefix.slice(0, -1);
        const folderPath = this.resolveKey(folderKey);
        return containsFile(folderPath);
    }

    public async createMultipartUpload(key: string): Promise<string> {
        this.resolveKey(key);
        const uploadId = mdbid();
        const uploadPath = this.resolveUploadPath(uploadId);
        await mkdir(uploadPath, { recursive: true });
        const keyPath = path.join(uploadPath, TARGET_KEY_FILE);
        await writeFile(keyPath, key);
        return uploadId;
    }

    public async uploadPart(params: ObjectStorage.UploadPartParams): Promise<string> {
        const { key, uploadId, partNumber, body } = params;
        await this.assertUploadTarget(key, uploadId);

        const uploadPath = this.resolveUploadPath(uploadId);
        const partPath = path.join(uploadPath, `${PART_FILE_PREFIX}${partNumber}`);
        await writeFile(partPath, body);
        return createHash("md5").update(body).digest("hex");
    }

    public async completeMultipartUpload(key: string, uploadId: string): Promise<void> {
        await this.assertUploadTarget(key, uploadId);

        const uploadPath = this.resolveUploadPath(uploadId);
        const entries = await readdir(uploadPath);
        const partNumbers = entries
            .filter(name => name.startsWith(PART_FILE_PREFIX))
            .map(name => {
                const partNumber = name.slice(PART_FILE_PREFIX.length);
                return Number(partNumber);
            })
            .filter(partNumber => Number.isInteger(partNumber) && partNumber > 0)
            .sort((a, b) => a - b);
        if (partNumbers.length === 0) {
            throw new Error(`Multipart upload "${uploadId}" has no parts.`);
        }

        // Written next to the target and renamed into place, so a reader never sees half a file.
        const filePath = this.resolveKey(key);
        const temporaryPath = temporaryPathFor(filePath);
        await ensureParentFolder(filePath);
        const handle = await open(temporaryPath, "w");
        try {
            for (const partNumber of partNumbers) {
                const partPath = path.join(uploadPath, `${PART_FILE_PREFIX}${partNumber}`);
                // oxlint-disable-next-line no-await-in-loop -- parts are appended in order.
                const part = await readFile(partPath);
                // `appendFile` writes the whole part; one `write` call may write less.
                // oxlint-disable-next-line no-await-in-loop -- parts are appended in order.
                await handle.appendFile(part);
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

    public async abortMultipartUploads(
        params: ObjectStorage.AbortMultipartUploadsParams
    ): Promise<number> {
        const { prefix, startedBefore } = params;
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
            const keyPath = path.join(uploadPath, TARGET_KEY_FILE);
            try {
                /*
                 * When the upload started: the key file is written then and never again, while the
                 * folder changes with every part, as S3 counts it too.
                 */
                // oxlint-disable-next-line no-await-in-loop -- one folder at a time is enough here.
                const stats = await stat(keyPath);
                if (stats.mtimeMs >= startedBefore.getTime()) {
                    continue;
                }
                // oxlint-disable-next-line no-await-in-loop -- one folder at a time is enough here.
                const targetKey = await readFile(keyPath, "utf8");
                if (!targetKey.startsWith(prefix)) {
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
        const uploadPath = this.resolveUploadPath(uploadId);
        const keyPath = path.join(uploadPath, TARGET_KEY_FILE);
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
    dependencies: [DiskStorageConfig]
});
