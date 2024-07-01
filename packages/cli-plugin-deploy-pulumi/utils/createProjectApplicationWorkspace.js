const path = require("path");
const util = require("util");
const ncpBase = require("ncp");
const ncp = util.promisify(ncpBase.ncp);
const { replaceInPath } = require("replace-in-path");
const { createProjectApplicationWorkspace } = require("@webiny/cli/utils");

module.exports = async ({ projectApplication, inputs }) => {
    await createProjectApplicationWorkspace(projectApplication);

    // Copy Pulumi-related files.
    await ncp(path.join(__dirname, "workspaceTemplate"), projectApplication.paths.workspace);

    // Wait a bit and make sure the files are ready to have its content replaced.
    await new Promise(resolve => setTimeout(resolve, 10));

    replaceInPath(path.join(projectApplication.paths.workspace, "/**/*.{ts,js,yaml}"), [
        { find: "{PROJECT_ID}", replaceWith: projectApplication.id },
        { find: "{PROJECT_DESCRIPTION}", replaceWith: projectApplication.description },
        { find: "{DEPLOY_ENV}", replaceWith: inputs.env }
    ]);
};
