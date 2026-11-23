import fs from "fs";
import path from "path";

// Before the store existed, the Pulumi CLI was extracted into each project's PULUMI_HOME, next to
// `credentials.json`, `workspaces` and `plugins`. The executables are the only files there whose
// names start with "pulumi", so those are removed and everything else stays.
export const removeProjectBinaries = (pulumiHome: string) => {
    if (!fs.existsSync(pulumiHome)) {
        return;
    }

    for (const entry of fs.readdirSync(pulumiHome, { withFileTypes: true })) {
        if (entry.isFile() && entry.name.startsWith("pulumi")) {
            fs.rmSync(path.join(pulumiHome, entry.name), { force: true });
        }
    }
};
