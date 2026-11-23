import fs from "fs";
import path from "path";

const LEGACY_BINARIES = ["pulumi", "pulumi.exe"];

/*
 * Before the store existed, the Pulumi CLI was extracted into each project's PULUMI_HOME, next to
 * `credentials.json`, `workspaces` and `plugins`. That layout is recognised by the `pulumi`
 * executable itself, and only then are the files whose names start with "pulumi" removed. Once they
 * are gone, the check finds nothing and the folder is never touched again.
 */
export const removeProjectBinaries = (pulumiHome: string) => {
    const hasLegacyBinary = LEGACY_BINARIES.some(name => {
        const binaryPath = path.join(pulumiHome, name);
        return fs.existsSync(binaryPath);
    });

    if (!hasLegacyBinary) {
        return;
    }

    for (const entry of fs.readdirSync(pulumiHome, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.startsWith("pulumi")) {
            continue;
        }

        const filePath = path.join(pulumiHome, entry.name);
        fs.rmSync(filePath, { force: true });
    }
};
