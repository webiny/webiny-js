const execa = require("execa");

module.exports = options => {
    const watchCommand = execa(
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
            cwd: options.cwd,
            env: { FORCE_COLOR: true }
        }
    );

    watchCommand.stdout.on("data", data => {
        if (options.logs) {
            const line = data.toString();
            console.log(line);
        }
    });

    watchCommand.stderr.on("data", data => {
        if (options.logs) {
            const line = data.toString();
            console.log(line);
        }
    });

    return watchCommand;
};
