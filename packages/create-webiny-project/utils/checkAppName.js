const { red, green } = require("chalk");
const validateProjectName = require("validate-npm-package-name");

module.exports = projectName => {
    const validationResult = validateProjectName(projectName);
    if (!validationResult.validForNewPackages) {
        console.error(
            red(
                `Cannot create a project named ${green(
                    `"${projectName}"`
                )} because of npm naming restrictions:\n`
            )
        );
        [...(validationResult.errors || []), ...(validationResult.warnings || [])].forEach(
            error => {
                console.error(red(`  * ${error}`));
            }
        );
        console.error(red("\nPlease choose a different project name."));
        process.exit(1);
    }
};
