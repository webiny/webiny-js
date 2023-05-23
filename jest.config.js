const fs = require("fs");
const path = require("path");
const findUp = require("find-up");

// Loads environment variables defined in the project root ".env" file.
const { parsed } = require("dotenv").config({ path: path.join(__dirname, ".env") });
if (parsed) {
    ["WCP_PROJECT_ID", "WCP_PROJECT_ENVIRONMENT", "WCP_PROJECT_LICENSE"].forEach(key => {
        delete parsed[key];
        delete process.env[key];
    });

    console.log('The following environment variables were included from the root ".env" file:');
    console.log(
        Object.keys(parsed).reduce((current, item) => {
            return current + `‣ ${item}\n`;
        }, "")
    );
}

const createPackageJestConfigPath = pkg => {
    const jestConfigPath = path.join(pkg, "jest.config.js");
    if (!fs.existsSync(jestConfigPath)) {
        return null;
    }
    return jestConfigPath;
};

const createPackageJestSetupPath = pkg => {
    const setupPath = path.join(pkg, "jest.setup.js");
    if (!fs.existsSync(setupPath)) {
        return null;
    }
    return setupPath;
};

const hasPackageJestConfig = pkg => {
    return !!createPackageJestConfigPath(pkg);
};

const getPackageJestSetup = pkg => {
    const setupPath = createPackageJestSetupPath(pkg);
    if (!setupPath) {
        return null;
    }
    return require(setupPath);
};

const getPackageNameFromPath = value => {
    if (!value.includes(".") && !value.includes("/")) {
        return value;
    }
    const packageJson = findUp.sync("package.json", {
        cwd: value.includes(".") ? path.dirname(value) : value
    });
    return path.dirname(packageJson).split("/").pop();
};

const jestExecutable = process.argv.findIndex(arg => arg.endsWith("jest.js"));
const jestConfig = process.argv.findIndex(arg => arg.endsWith("jest.config.js"));
// This parameter is used by Webstorm, when running a particular test file.
const runByPath = process.argv.findIndex(arg => arg === "--runTestsByPath");

let packageName = "";
if (jestConfig > -1) {
    packageName = getPackageNameFromPath(process.argv[jestConfig + 1]);
} else if (runByPath > -1) {
    // Find the package this test file belongs to.
    packageName = getPackageNameFromPath(process.argv[runByPath + 1]);
} else if (jestExecutable > -1) {
    const target = process.argv[jestExecutable + 1];
    if (target.includes("/")) {
        packageName = getPackageNameFromPath(target);
    } else {
        packageName = target;
    }
}

if (packageName.includes("packages")) {
    packageName = path.resolve(packageName);
} else {
    packageName = path.resolve("packages", packageName);
}

const packageRoot = packageName.replace(/\\/g, "/");

const hasConfig = hasPackageJestConfig(packageRoot);
const setup = getPackageJestSetup(packageRoot);

if (!hasConfig && !setup) {
    throw new Error(`${packageName} is missing a jest.config.js or a jest.setup.js file!`);
}

const project = hasConfig ? require(createPackageJestConfigPath(packageRoot)) : setup;
if (runByPath > -1) {
    project.testMatch = [process.argv[runByPath + 1]];
}

module.exports = {
    projects: [project],
    modulePathIgnorePatterns: ["dist"],
    testTimeout: 30000,
    watchman: false
};
