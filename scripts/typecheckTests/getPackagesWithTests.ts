import { getPackages } from "../utils/getPackages.js";

export const getPackagesWithTests = () => {
    const workspaces = getPackages({ includes: ["/packages/"] });

    return workspaces.filter(wp => wp.isTs && wp.hasTests);
};
