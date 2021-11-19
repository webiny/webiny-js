const path = require("path");

// The watch functionality is actually not part of `@babel/core`, but
// part of the `@babel/cli` library. That's the reason we're extracting
// the watch functionality out of it.
module.exports = options => {
    const { default: parseArgv } = require("@babel/cli/lib/babel/options");
    const { default: dir } = require("@babel/cli/lib/babel/dir");
    const { default: file } = require("@babel/cli/lib/babel/file");

    const parsedArgv = parseArgv([
        "_",
        "_",
        path.join(options.cwd, "src"),
        "-d",
        path.join(options.cwd, "dist"),
        "--source-maps",
        "--copy-files",
        "--extensions",
        `.ts,.tsx`,
        "--watch"
    ]);

    if (parsedArgv) {
        const fn = parsedArgv.cliOptions.outDir ? dir : file;
        return fn(parsedArgv).catch(err => {
            console.error(err);
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
};
