import fs from "fs";
import path from "path";

export interface RemoveUnusedFoldersParams {
    parentFolder: string;
    keep: string;
    match: (name: string) => boolean;
    maxAgeMs: number;
}

// Projects on the same machine can need different versions, so a version is removed only once no
// project has used it for `maxAgeMs`. A project marks the version it uses by updating the folder's
// modification time on every run. A removed version is downloaded again if a project needs it.
export const removeUnusedFolders = (params: RemoveUnusedFoldersParams) => {
    const { parentFolder, keep, match, maxAgeMs } = params;

    if (!fs.existsSync(parentFolder)) {
        return;
    }

    const now = new Date();
    fs.utimesSync(path.join(parentFolder, keep), now, now);

    for (const entry of fs.readdirSync(parentFolder, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name === keep || !match(entry.name)) {
            continue;
        }

        const folder = path.join(parentFolder, entry.name);
        if (now.getTime() - fs.statSync(folder).mtimeMs < maxAgeMs) {
            continue;
        }

        fs.rmSync(folder, { recursive: true, force: true });
        fs.rmSync(folder + ".lock", { force: true });
    }
};
