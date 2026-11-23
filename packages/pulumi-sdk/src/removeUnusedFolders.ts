import fs from "fs";
import path from "path";

const UNUSED_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export interface RemoveUnusedFoldersParams {
    parentFolder: string;
    keep: string;
    match: (name: string) => boolean;
}

/*
 * Projects on the same machine can need different versions, so a version is removed only once no
 * project has used it for 30 days. A project marks the version it uses by updating the folder's
 * modification time on every run. A removed version is downloaded again if a project needs it.
 */
export const removeUnusedFolders = (params: RemoveUnusedFoldersParams) => {
    const { parentFolder, keep, match } = params;

    if (!fs.existsSync(parentFolder)) {
        return;
    }

    const now = new Date();
    const keptFolder = path.join(parentFolder, keep);
    fs.utimesSync(keptFolder, now, now);

    for (const entry of fs.readdirSync(parentFolder, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name === keep || !match(entry.name)) {
            continue;
        }

        const folder = path.join(parentFolder, entry.name);

        // Another project may have removed it since the folder was listed.
        const stat = fs.statSync(folder, { throwIfNoEntry: false });
        if (!stat || now.getTime() - stat.mtimeMs < UNUSED_MAX_AGE_MS) {
            continue;
        }

        fs.rmSync(folder, { recursive: true, force: true });
        fs.rmSync(folder + ".lock", { force: true });
    }
};
