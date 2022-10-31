const path = require("path");
const fs = require("fs");
const findUp = require("find-up");

const usingAddAuthenticator = source => source.match("addAuthenticator");
const usingEnterprisePackage = sourceFilePath => {
    const cwd = path.dirname(sourceFilePath);
    const parentPackageJsonPath = findUp.sync("package.json", { cwd });
    const parentPackageJson = JSON.parse(fs.readFileSync(parentPackageJsonPath).toString());
    return "@webiny/enterprise" in parentPackageJson.dependencies;
};

module.exports = function (source) {
    if (!usingAddAuthenticator(source)) {
        return source;
    }

    if (usingEnterprisePackage(this.resourcePath)) {
        return source;
    }

    this.emitError(new Error("Cannot add authenticators. This is an EE feature."));
};
