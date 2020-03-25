const { join } = require("path");
const fs = require("fs");
const { red } = require("chalk");
const { execute } = require("../utils/execute");
const { paths } = require("../utils/paths");

module.exports = async inputs => {
    // Store current `cwd`
    const cwd = process.cwd();

    // Change CWD to the requested folder
    const newCwd = join(cwd, inputs.folder);
    if (!fs.existsSync(newCwd)) {
        console.log(`⚠️ ${red(paths.replaceProjectRoot(newCwd))} does not exist!`);
        return;
    }

    process.chdir(newCwd);
    await execute(inputs, "remove");
    console.log(`\n🎉 Done! Resources removed.`);

    // Restore the original `cwd`
    process.chdir(cwd);
};
