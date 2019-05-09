const changelogFactory = require("./changelogGenerator");

module.exports = async (labels, commits) => {
    return await changelogFactory({ labels })(commits);
};
