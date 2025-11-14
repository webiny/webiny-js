import glob from "glob";
import loadJsonFile from "load-json-file";

const excludedPackages = ["@webiny/di"];

const target = "./packages/*/package.json";

const stripWebinyPath = p => {
    return p.replace("./packages/", "");
};
const dependencyObjects = ["dependencies", "devDependencies", "peerDependencies"];
const hasWebinyPackageVersion = pkg => {
    const packageJson = loadJsonFile.sync(`${pkg}/package.json`);
    for (const obj of dependencyObjects) {
        const packages = packageJson[obj];
        if (!packages) {
            continue;
        }
        for (const p in packages) {
            if (excludedPackages.includes(p)) {
                continue;
            } else if (p.startsWith("@webiny/") === false) {
                continue;
            } else if (packages[p] === "*") {
                // we can safely continue here as it means that, probably, peerDependency for @webiny is set to anything.
                continue;
            } else if (packages[p] !== "0.0.0") {
                return true;
            }
        }
    }
    return false;
};

const getPackageName = packageJsonFile => {
    const packageJson = loadJsonFile.sync(packageJsonFile);
    return packageJson.name;
};

const checkPackageNodeModules = () => {
    const packages = glob.sync(target);
    for (let pkg of packages) {
        pkg = pkg.replace("/package.json", "");
        const name = stripWebinyPath(pkg);
        const hasVersions = hasWebinyPackageVersion(pkg);
        if (hasVersions) {
            console.log(`[VERSION] ${name} has Webiny packages with version value not 0.0.0`);
            continue;
        }
        const subpackages = glob.sync(`${pkg}/node_modules/*/package.json`);
        if (subpackages.length !== 0) {
            console.log(
                `[SUBPACKAGES] "${name}" has ${subpackages.length} subpackages: ${subpackages
                    .map(p => getPackageName(p))
                    .join(", ")}`
            );
            console.log("------------------------------");
        }
    }
};

checkPackageNodeModules();
