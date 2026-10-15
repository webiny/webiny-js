import { createHash } from "node:crypto";
import { type GetProjectService } from "@webiny/project/abstractions/index.js";

/**
 * Standalone hosting-type counterpart to the `WEBINY_ADMIN_DEPLOYMENT_ID` that project-aws reads from
 * the Core stack output. The admin prefixes its local storage keys with it, so two projects served
 * from the same origin (e.g. both on localhost:3001) don't read each other's state. Without it the
 * prefix was `webiny/undefined` for every standalone project, and a fresh one showed the login screen
 * instead of the installer, because it picked up the previous project's install state.
 *
 * There is no deploy here to mint an ID, so derive one from the project root path. That keeps it
 * stable across builds of the same project without storing it anywhere.
 */
export const setAdminDeploymentId = (getProjectService: GetProjectService.Interface): void => {
    if (process.env.WEBINY_ADMIN_DEPLOYMENT_ID) {
        return;
    }

    const project = getProjectService.execute();
    const rootFolder = project.paths.rootFolder.toString();

    process.env.WEBINY_ADMIN_DEPLOYMENT_ID = createHash("sha256")
        .update(rootFolder)
        .digest("hex")
        .slice(0, 10);
};
