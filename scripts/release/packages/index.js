require("dotenv").config();
const path = require("path");
const hookStd = require("hook-std");
const { argv } = require("yargs");
const getWorkspaces = require("get-yarn-workspaces");
const buildParams = require("../utils/buildParams");
const stdOut = require("../utils/stdOut");
const compose = require("../utils/compose");
const getPackages = require("../utils/getPackages");

const analyzeCommits = require("./plugins/analyzeCommits");
const verifyEnvironment = require("./plugins/verifyEnvironment");
const githubVerify = require("./plugins/github/verify");
const githubPublish = require("./plugins/github/publish");
const npmVerify = require("./plugins/npm/verify");
const npmPublish = require("./plugins/npm/publish");
const updatePackages = require("./plugins/updatePackages");

const release = async config => {
    const { params, plugins } = await buildParams(config);

    // Connect to the stdout and process each line of the output using `stdOut` function
    const { unhook } = hookStd(
        {
            silent: false,
            streams: [process.stdout, process.stderr].filter(Boolean)
        },
        stdOut
    );
    try {
        await compose(plugins)(params);
        unhook();
        return params;
    } catch (err) {
        console.log(err);
    }
    unhook();
};

// Get `independent` packages
const independent = getWorkspaces()
    .filter(dir => {
        const configPath = path.join(dir, ".releaserc.js");
        try {
            return require(configPath).type === "independent";
        } catch (e) {
            return false;
        }
    })
    .map(dir => path.basename(dir));

// Only include non-independent packages
const packages = getPackages("build/node_modules/*").filter(pkg => !independent.includes(pkg.name));

release({
    ci: true,
    preview: argv.preview || false,
    branch: argv.branch || "master",
    packages,
    plugins: [
        verifyEnvironment(),
        githubVerify(),
        npmVerify(),
        analyzeCommits(),
        updatePackages(),
        npmPublish(),
        githubPublish()
    ]
});
