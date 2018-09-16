// @flow
const args = require("yargs").argv;
const path = require("path");
const execa = require("execa");
const readPkg = require("read-pkg");
const minimatch = require("minimatch");
const createLogger = require("./utils/createLogger");
const getPackages = require("get-yarn-workspaces");

const cmd = args._.pop();
const destination = args.out ? path.resolve(args.out) : null;
const scope = args.scope ? (Array.isArray(args.scope) ? args.scope : [args.scope]) : ["**"];

function hasCommand(packagePath) {
    const pkg = readPkg.sync({ cwd: packagePath });
    return pkg.scripts && pkg.scripts.hasOwnProperty(cmd);
}

async function runAll() {
    let mainCmd = "yarn";
    let baseArgs = [cmd, ...(args["--"] || [])].filter(p => p);

    if (destination) {
        mainCmd = "cross-env";
        baseArgs = ["yarn", ...baseArgs];
    }

    const packages = getPackages(process.cwd())
        // Filter packages using scope globs
        .filter(p => scope.some(s => minimatch(path.basename(p), s)))
        // Filter packages that contain the requested script
        .filter(hasCommand);

    packages.forEach(dir => {
        const name = path.basename(dir);
        const args = destination ? ["DEST=" + path.join(destination, name), ...baseArgs] : baseArgs;
        const logger = createLogger(name);
        const stream = execa(mainCmd, args, { cwd: dir }).stdout;

        stream.on("data", value => {
            logger(value.toString().replace(/\n$/, ""));
        });
    });
}

runAll();
