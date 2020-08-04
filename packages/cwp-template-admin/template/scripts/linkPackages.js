/**
 * This tool will re-link monorepo packages to one of the following directories (by priority):
 * - {package}/package.json -> publishConfig.directory
 * - lerna.json -> command.publish.contents
 * - package root directory
 */
(async () => {
    const { linkPackages } = require("@webiny/project-utils/packages");
    await linkPackages();
})();
