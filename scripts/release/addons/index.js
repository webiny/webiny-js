require("dotenv").config();
const hookStd = require("hook-std");
const path = require("path");
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

// Get `addons` packages
const addons = getWorkspaces()
    .filter(dir => dir.startsWith(process.cwd() + "/addons/"))
    .map(dir => path.basename(dir));

// Mark addon packages with `isAddon`
const packages = getPackages("build/node_modules/*").map(pkg => {
    if (addons.includes(pkg.name)) {
        pkg.isAddon = true;
        pkg.tagFormat = `${pkg.name}@v<%= version %>`;
    } else {
        pkg.tagFormat = `v<%= version %>`;
    }
    return pkg;
});

release({
    ci: !!argv.ci,
    preview: argv.preview || false,
    branch: argv.branch || "master",
    registryUrl: "http://localhost:4873",
    packages,
    plugins: [
        verifyEnvironment(),
        githubVerify(),
        //npmVerify(),
        analyzeCommits(),
        updatePackages(),
        //npmPublish(),
        githubPublish()
    ]
});
