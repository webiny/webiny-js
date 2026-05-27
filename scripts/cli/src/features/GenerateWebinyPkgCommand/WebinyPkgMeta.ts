import crypto from "crypto";
import fs from "fs";
import path from "path";
import type { ScanExportsFoldersService } from "../../abstractions/index.js";

export const INPUTS_HASH_FIELD = "exportGenerationHash";

export interface ComputeInputsHashParams {
    exportFilesMap: Map<string, ScanExportsFoldersService.ExportFile[]>;
    iconsSrcPath: string | null;
    srcStaticPath: string | null;
}

export interface InputEntry {
    key: string;
    filePath: string;
}

export function collectInputEntries(params: ComputeInputsHashParams): InputEntry[] {
    const { exportFilesMap, iconsSrcPath, srcStaticPath } = params;

    const entries: InputEntry[] = [];

    for (const [relativePath, exportFiles] of exportFilesMap) {
        for (const exportFile of exportFiles) {
            entries.push({
                key: `export:${exportFile.packageName}:${relativePath}`,
                filePath: exportFile.absolutePath
            });
        }
    }

    if (iconsSrcPath && fs.existsSync(iconsSrcPath)) {
        for (const filePath of getAllFiles(iconsSrcPath)) {
            entries.push({ key: `icons:${path.relative(iconsSrcPath, filePath)}`, filePath });
        }
    }

    if (srcStaticPath && fs.existsSync(srcStaticPath)) {
        for (const filePath of getAllFiles(srcStaticPath)) {
            entries.push({ key: `static:${path.relative(srcStaticPath, filePath)}`, filePath });
        }
    }

    entries.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
    return entries;
}

export function computeInputsHash(params: ComputeInputsHashParams): string {
    const hasher = crypto.createHash("sha256");
    const debug = process.env.WBY_HASH_DEBUG === "1";
    for (const { key, filePath } of collectInputEntries(params)) {
        const fileHash = crypto
            .createHash("sha256")
            .update(fs.readFileSync(filePath))
            .digest("hex")
            .slice(0, 8);
        if (debug) {
            process.stderr.write(`  ${fileHash}  ${key}\n`);
        }
        hasher.update(`${key}:`);
        hasher.update(fs.readFileSync(filePath));
        hasher.update("\n---\n");
    }
    return hasher.digest("hex");
}

export function getAllFiles(dirPath: string, files: string[] = []): string[] {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            getAllFiles(fullPath, files);
        } else {
            files.push(fullPath);
        }
    }
    return files;
}
