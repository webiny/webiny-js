import hookStd from "hook-std";
import compose from "webiny-compose";

import getLernaPackages from "./utils/getLernaPackages";
import getSinglePackage from "./utils/getSinglePackage";
import buildParams from "./utils/buildParams";
import stdOut from "./utils/stdOut";

import verifyEnvironment from "./plugins/verifyEnvironment";
import analyzeCommits from "./plugins/analyzeCommits";
import githubVerify from "./plugins/github/verify";
import githubPublish from "./plugins/github/publish";
import npmVerify from "./plugins/npm/verify";
import npmPublish from "./plugins/npm/publish";
import releaseNotes from "./plugins/releaseNotes";
import updatePackageJson from "./plugins/updatePackageJson";

export {
    analyzeCommits,
    githubVerify,
    githubPublish,
    npmVerify,
    npmPublish,
    releaseNotes,
    updatePackageJson,
    getLernaPackages,
    getSinglePackage
};

export default async config => {
    const { params, plugins } = await buildParams(config);

    // Connect to the stdout and process each line of the output using `stdOut` function
    const unhook = hookStd({ silent: false }, stdOut);
    try {
        await compose([verifyEnvironment(), ...plugins])(params);
        unhook();
        return params;
    } catch (err) {
        unhook();
        throw err;
    }
};
