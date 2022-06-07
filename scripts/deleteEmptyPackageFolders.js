const fs = require("fs");
const getPackages = require("get-yarn-workspaces");
const { argv } = require("yargs");

const isMissingPackageJson = p => !fs.existsSync(p + "/package.json");

const args = {
    preview: argv.preview
};

/**
 * Deletes empty package folders. Useful when switching branches and when left with empty package folders.
 * Pass "--preview" to prevent any actual deletions from happening. Will only return a list of packages.
 */

(async () => {
    const packagesWithoutPackageJson = getPackages().filter(isMissingPackageJson);

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
    if (args.preview === false) {
        for (let i = 0; i < packagesWithoutPackageJson.length; i++) {
            const pkg = packagesWithoutPackageJson[i];
            fs.rmdirSync(pkg, { recursive: true });
        }

        console.log("Empty package folders deleted.");
    } else {
        console.log(
            "Note: in order to actually delete these folders, run the command again, with the --no-preview flag."
        );
    }
})();
