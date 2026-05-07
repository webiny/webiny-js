import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import type { Readable, Writable } from "node:stream";

/**
 * Disk-backed storage for file bytes. Pure FS — no metadata, no signing.
 * The metadata side of the file manager continues to live in CMS storage ops.
 */
export class FsFileStorage {
    public constructor(public readonly uploadDir: string) {
        // Eager mkdir so the first request doesn't race against directory
        // creation. Recursive + idempotent — safe to run on every container
        // start.
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    /**
     * Resolve a storage key to an absolute filesystem path. Rejects path
     * components that try to escape the upload dir (e.g., `../`); the FS
     * driver doesn't trust caller-provided keys.
     */
    public resolvePath(key: string): string {
        const safe = path.normalize(key).replace(/^(\.\.[/\\])+/, "");
        const full = path.resolve(this.uploadDir, safe);
        if (
            !full.startsWith(path.resolve(this.uploadDir) + path.sep) &&
            full !== path.resolve(this.uploadDir)
        ) {
            throw new Error(`Refusing to access path outside upload directory: ${key}`);
        }
        return full;
    }

    public async write(key: string, source: Readable): Promise<void> {
        const target = this.resolvePath(key);
        await fs.promises.mkdir(path.dirname(target), { recursive: true });
        const sink = fs.createWriteStream(target) as unknown as Writable;
        await pipeline(source, sink);
    }

    public openReadStream(key: string): Readable {
        const target = this.resolvePath(key);
        return fs.createReadStream(target);
    }

    public async stat(key: string): Promise<fs.Stats | null> {
        try {
            return await fs.promises.stat(this.resolvePath(key));
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code === "ENOENT") {
                return null;
            }
            throw err;
        }
    }

    public async delete(key: string): Promise<void> {
        try {
            await fs.promises.unlink(this.resolvePath(key));
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
                throw err;
            }
        }
    }
}
