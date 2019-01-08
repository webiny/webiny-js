require("dotenv").config();
const hookStd = require("hook-std");
const { argv } = require("yargs");
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

release({
    ci: true,
    preview: argv.preview || false,
    branch: argv.branch || "master",
    packages: getPackages("build/node_modules/*"),
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
