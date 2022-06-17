const util = require("util");
const fs = require("fs");
const ncpBase = require("ncp");
const ncp = util.promisify(ncpBase.ncp);

module.exports = async projectApplication => {
    if (fs.existsSync(projectApplication.paths.workspace)) {
        fs.rmdirSync(projectApplication.paths.workspace, { recursive: true });
    }

    fs.mkdirSync(projectApplication.paths.workspace, { recursive: true });
    await ncp(projectApplication.paths.absolute, projectApplication.paths.workspace);

    // Wait a bit and make sure the files are ready to have its content replaced.
    return new Promise(resolve => setTimeout(resolve, 10));
};
