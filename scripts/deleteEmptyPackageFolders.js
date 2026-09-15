import fs from "fs-extra";
import path from "path";
import yargs from "yargs";

const rootDir = path.resolve(import.meta.dirname, "..");

const getWorkspaceGlobs = () => {
    const rootPkg = fs.readJsonSync(path.join(rootDir, "package.json"));
    const globs = rootPkg.workspaces?.packages || rootPkg.workspaces || [];
    return globs.filter(g => g.endsWith("/*"));
};

const scanWorkspaceDirs = () => {
    const globs = getWorkspaceGlobs();
    const dirs = [];
    for (const glob of globs) {
        const parent = path.join(rootDir, glob.replace("/*", ""));
        if (!fs.existsSync(parent)) {
            continue;
        }
        for (const entry of fs.readdirSync(parent, { withFileTypes: true })) {
            if (entry.isDirectory()) {
                dirs.push(path.join(parent, entry.name));
            }
        }
    }
    return dirs;
};

const isMissingPackageJson = p => !fs.existsSync(path.join(p, "package.json"));

/**
 * Deletes empty package folders. Useful when switching branches and when left with empty package folders.
 * Pass "--preview" to prevent any actual deletions from happening. Will only return a list of packages.
 */

const { argv } = yargs(process.argv);
const packagesWithoutPackageJson = scanWorkspaceDirs().filter(isMissingPackageJson);

if (packagesWithoutPackageJson.length) {
    console.log(`Found ${packagesWithoutPackageJson.length} empty package folder(s).`);
    console.log("The following folder(s) will be deleted:");
    for (let i = 0; i < packagesWithoutPackageJson.length; i++) {
        const pkg = packagesWithoutPackageJson[i];
        console.log(`${i + 1}. ${pkg}`);
    }
} else {
    console.log("There are no empty package folders to delete. Exiting...");
    process.exit(0);
}

console.log();
if (argv.preview === false) {
    for (let i = 0; i < packagesWithoutPackageJson.length; i++) {
        const pkg = packagesWithoutPackageJson[i];
        await fs.remove(pkg);
    }

    console.log("Empty package folders deleted.");
} else {
    console.log(
        "Note: in order to actually delete these folders, run the command again, with the --no-preview flag."
    );
}
