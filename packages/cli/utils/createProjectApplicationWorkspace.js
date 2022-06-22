const util = require("util");
const fs = require("fs-extra");
const ncpBase = require("ncp");
const ncp = util.promisify(ncpBase.ncp);

module.exports = async projectApplication => {
    if (await fs.pathExists(projectApplication.paths.workspace)) {
        await fs.remove(projectApplication.paths.workspace);
    }

    await fs.ensureDir(projectApplication.paths.workspace);
    await ncp(projectApplication.paths.absolute, projectApplication.paths.workspace);

    // Wait a bit and make sure the files are ready to have its content replaced.
    return new Promise(resolve => setTimeout(resolve, 10));
};
