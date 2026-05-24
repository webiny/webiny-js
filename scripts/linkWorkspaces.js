/**
 * This tool will re-link monorepo workspaces to one of the following directories (by priority):
 * - {workspaces}/package.json -> webiny.publishFrom
 * - workspace root directory
 */
(async () => {
    const { linkWorkspaces } = await import("../packages/build-tools/workspaces/linkWorkspaces.js");
    await linkWorkspaces();
})();
