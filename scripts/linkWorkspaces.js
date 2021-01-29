/**
 * This tool will re-link monorepo workspaces to one of the following directories (by priority):
 * - {workspaces}/package.json -> publishConfig.directory
 * - lerna.json -> command.publish.contents
 * - workspace root directory
 */
(async () => {
    const { linkWorkspaces } = require("../packages/project-utils/workspaces");
    await linkWorkspaces();
})();
