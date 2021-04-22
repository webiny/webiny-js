const execa = require("execa");

module.exports = () => {
    return execa.sync(
        "yarn",
        [
            "babel",
            "src",
            "-d",
            "dist",
            "--source-maps",
            "--copy-files",
            "--extensions",
            `.ts,.tsx`,
            "--watch"
        ],
        {
            stdio: "inherit"
        }
    );
};
