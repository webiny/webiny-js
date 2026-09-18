import semver from "semver";
import { execaSync } from "execa";
import { constraints } from "./constraints.js";

export class SystemRequirements {
    // Runs on every CLI invocation, so it spawns as little as possible: the Node version is already in
    // this process, which leaves a single `yarn --version` call.
    static validate() {
        const nodeVersion = SystemRequirements.getNodeVersion();
        const yarnVersion = SystemRequirements.getYarnVersion();

        const systemRequirements = {
            valid: false,
            node: {
                currentVersion: nodeVersion,
                requiredVersion: constraints.node,
                valid: semver.satisfies(nodeVersion, constraints.node)
            },
            yarn: {
                currentVersion: yarnVersion,
                requiredVersion: constraints.yarn,
                valid: semver.satisfies(yarnVersion, constraints.yarn)
            }
        };

        systemRequirements.valid = systemRequirements.node.valid && systemRequirements.yarn.valid;

        return systemRequirements;
    }

    static getNodeVersion() {
        return process.versions.node;
    }

    static getOsVersion() {
        return process.platform;
    }

    // Not part of `validate`. Only `webiny info` and create-webiny-project print these.
    static getNpmVersion() {
        const { stdout } = execaSync("npm", ["--version"]);
        return stdout;
    }

    static getNpxVersion() {
        const { stdout } = execaSync("npx", ["--version"]);
        return stdout;
    }

    static getYarnVersion() {
        const { stdout } = execaSync("yarn", ["--version"]);
        return stdout;
    }
}
