// @flow
const { readdirSync, existsSync } = require("fs");
const { join } = require("path");

// Find all folders in packages/* with package.json
const packagesRoot = join(__dirname, "..", "..", "packages");

const baseBlacklist = ["webiny-cli", "webiny-cloud", "webiny-cloud-api", "webiny-cloud-client"];

module.exports = (blacklist = []) => {
    const finalBlackList = [...baseBlacklist, ...blacklist];
    return readdirSync(packagesRoot).filter(dir => {
        if (finalBlackList.includes(dir)) {
            return false;
        }

        const packagePath = join(packagesRoot, dir, "package.json");
        return existsSync(packagePath);
    });
};
