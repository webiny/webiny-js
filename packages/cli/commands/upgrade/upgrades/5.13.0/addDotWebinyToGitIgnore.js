const fs = require("fs");
const path = require("path");

const addDotWebinyToGitIgnore = async context => {
    const { info, project } = context;

    info(`Adding ${info.hl(".webiny")} to the ${info.hl(".gitignore")} file...`);

    const gitIgnorePath = path.join(project.root, ".gitignore");
    const content = fs.readFileSync(gitIgnorePath).toString("utf8");

    if (content.match("\\.webiny")) {
        info(
            `Skipping - ${info.hl(".webiny")} already exists in the ${info.hl(".gitignore")} file.`
        );
        return [];
    }

    fs.appendFileSync(gitIgnorePath, ".webiny");
    info(`${info.hl(".webiny")} added to the ${info.hl(".gitignore")} file.`);
};

module.exports = {
    addDotWebinyToGitIgnore
};
