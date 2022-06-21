const path = require("path");
const util = require("util");
const ncpBase = require("ncp");
const ncp = util.promisify(ncpBase.ncp);
const { replaceInPath } = require("replace-in-path");
const { createProjectApplicationWorkspace } = require("@webiny/cli/utils");
const processHooks = require("./processHooks");

module.exports = async ({ projectApplication, context, inputs }) => {
    const hookArgs = { context, inputs, projectApplication };

    await runHook({ hook: "hook-before-create-workspace", context, args: hookArgs });
    await createProjectApplicationWorkspace(projectApplication);

    // Copy Pulumi-related files.
    await ncp(path.join(__dirname, "workspaceTemplate"), projectApplication.paths.workspace);

    // Wait a bit and make sure the files are ready to have its content replaced.
    await new Promise(resolve => setTimeout(resolve, 10));

    replaceInPath(path.join(projectApplication.paths.workspace, "/**/*.*"), [
        { find: "{PROJECT_ID}", replaceWith: projectApplication.id },
        { find: "{PROJECT_DESCRIPTION}", replaceWith: projectApplication.description },
        { find: "{DEPLOY_ENV}", replaceWith: inputs.env }
    ]);

    await runHook({ hook: "hook-after-create-workspace", context, args: hookArgs });
};

async function runHook({ hook, args, context }) {
    context.info(`Running "${hook}" hook...`);
    await processHooks(hook, args);
    context.success(`Hook "${hook}" completed.`);
}
