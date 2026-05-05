import crypto from "crypto";
import fs from "fs";
import path from "path";
import type { ScanExportsFoldersService } from "../../abstractions/index.js";

const META_FILE_NAME = ".webiny-pkg-meta.json";

export interface WebinyPkgMeta {
    inputsHash: string;
}

export interface ComputeInputsHashParams {
    exportFilesMap: Map<string, ScanExportsFoldersService.ExportFile[]>;
    iconsSourcePath: string | null;
    srcStaticPath: string | null;
}

export function computeInputsHash(params: ComputeInputsHashParams): string {
    const { exportFilesMap, iconsSourcePath, srcStaticPath } = params;

    const entries: Array<{ key: string; filePath: string }> = [];

    for (const [relativePath, exportFiles] of exportFilesMap) {
        for (const exportFile of exportFiles) {
            entries.push({
                key: `export:${exportFile.packageName}:${relativePath}`,
                filePath: exportFile.absolutePath
            });
        }
    }

    if (iconsSourcePath && fs.existsSync(iconsSourcePath)) {
        for (const filePath of getAllFiles(iconsSourcePath)) {
            // Matches the filter applied in copyDirectoryRecursive for icons.
            if (path.basename(filePath) === "package.json") {
                continue;
            }
            entries.push({ key: `icons:${path.relative(iconsSourcePath, filePath)}`, filePath });
        }
    }

    if (srcStaticPath && fs.existsSync(srcStaticPath)) {
        for (const filePath of getAllFiles(srcStaticPath)) {
            entries.push({ key: `static:${path.relative(srcStaticPath, filePath)}`, filePath });
        }
    }

    entries.sort((a, b) => a.key.localeCompare(b.key));

    const hasher = crypto.createHash("sha256");
    for (const { key, filePath } of entries) {
        hasher.update(`${key}:`);
        hasher.update(fs.readFileSync(filePath));
        hasher.update("\n---\n");
    }

    return hasher.digest("hex");
}

function getAllFiles(dirPath: string, files: string[] = []): string[] {
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

export function readMetaFile(webinyPkgFolderPath: string): WebinyPkgMeta | null {
    const metaPath = path.join(webinyPkgFolderPath, META_FILE_NAME);
    if (!fs.existsSync(metaPath)) {
        return null;
    }
    return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
}

export function writeMetaFile(webinyPkgFolderPath: string, meta: WebinyPkgMeta): void {
    const metaPath = path.join(webinyPkgFolderPath, META_FILE_NAME);
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");
}
