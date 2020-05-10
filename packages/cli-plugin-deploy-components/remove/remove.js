const { join } = require("path");
const fs = require("fs");
const { red } = require("chalk");
const { execute } = require("../execute");

module.exports = async (inputs, context) => {
    // Store current `cwd`
    const cwd = process.cwd();

    // Change CWD to the requested folder
    const newCwd = join(cwd, inputs.folder);
    if (!fs.existsSync(newCwd)) {
        console.log(`⚠️ ${red(context.replaceProjectRoot(newCwd))} does not exist!`);
        return;
    }

    process.chdir(newCwd);
    await execute(inputs, "remove", context);
    console.log(`\n🎉 Done! Resources removed.`);

    // Restore the original `cwd`
    process.chdir(cwd);
};
