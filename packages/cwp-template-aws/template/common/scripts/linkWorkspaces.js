/**
 * This tool will re-link monorepo workspaces to one of the following directories (by priority):
 * - {workspace}/package.json -> publishConfig.directory
 * - workspace root directory
 */
(async () => {
    const { linkWorkspaces } = require("@webiny/project-utils/workspaces");
    await linkWorkspaces();
})();
