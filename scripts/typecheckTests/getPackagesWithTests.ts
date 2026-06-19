import fs from "fs";
import { getPackages } from "../utils/getPackages.js";

export const getPackagesWithTests = () => {
    const workspaces = getPackages({ includes: ["/packages/"] });

    return workspaces.filter(wp => {
        if (!wp.isTs || !wp.hasTests) {
            return false;
        }

        const checkTestsPath = wp.packageFolder + "/tsconfig.check-tests.json";
        return fs.existsSync(checkTestsPath);
    });
};
