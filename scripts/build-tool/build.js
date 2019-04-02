// @flow
const args = require("yargs").argv;
const { unlinkSync, existsSync } = require("fs");
const chalk = require("chalk");
const path = require("path");
const fs = require("fs-extra");
const minimatch = require("minimatch");
const execa = require("execa");
const getPackages = require("get-yarn-workspaces");

const {
    asyncCopyTo,
    asyncExecuteCommand,
    asyncExtractTar,
    asyncRimRaf
} = require("./utils/packaging");

const destination = args.out ? path.resolve(args.out) : null;
const scope = args.scope ? (Array.isArray(args.scope) ? args.scope : [args.scope]) : ["**"];

function hasReleaseConfig(packagePath) {
    return fs.existsSync(path.join(packagePath, ".releaserc.js"));
}

async function buildEverything() {
    // eslint-disable-next-line
    console.log(chalk.green("Build process started."));
    // eslint-disable-next-line
    console.log(chalk.green("Please remain patient while all packages are being built."));

    // Delete the folder so we always have a fresh start.
    await asyncRimRaf("build");

    let mainCmd = "yarn";
    let baseArgs = ["build", ...(args["--"] || [])].filter(p => p);

    if (destination) {
        mainCmd = "cross-env";
        baseArgs = ["yarn", ...baseArgs];
    }

    // Build all packages, one by one.
    const packages = getPackages(process.cwd())
        .filter(hasReleaseConfig)
        .filter(p => scope.some(s => minimatch(path.basename(p), s)));

    await Promise.all(
        packages.map(dir => {
            return (async () => {
                const name = path.basename(dir);
                const args = ["DEST=" + path.join(destination, name), ...baseArgs];
                await execa(mainCmd, args, { cwd: dir });

                // Create (simulate) NPM packages.
                await prepareNpmPackage({ name, dir });

                // eslint-disable-next-line
                console.log(chalk.cyan("✓ " + name));
            })();
        })
    );

    // eslint-disable-next-line
    console.log(chalk.green("Build finished!"));
}

function getTarOptions(tgzName, packageName) {
    // Files inside the `npm pack`ed archive start
    // with "package/" in their paths. We'll undo
    // this during extraction.
    const CONTENTS_FOLDER = "package";
    return {
        src: tgzName,
        dest: `${destination}/${packageName}`,
        tar: {
            entries: [CONTENTS_FOLDER],
            map(header) {
                if (header.name.indexOf(CONTENTS_FOLDER + "/") === 0) {
                    header.name = header.name.substring(CONTENTS_FOLDER.length + 1);
                }
            }
        }
    };
}

async function prepareNpmPackage({ name, dir }) {
    try {
        await Promise.all([
            asyncCopyTo(`LICENSE`, `${destination}/${name}/LICENSE`),
            asyncCopyTo(`${dir}/package.json`, `${destination}/${name}/package.json`),

            (async () => {
                if (!existsSync(`${dir}/README.md`)) {
                    throw Error(`Missing README.md file in "${name}" package.`);
                }
                await asyncCopyTo(`${dir}/README.md`, `${destination}/${name}/README.md`);
            })()
        ]);
    } catch (e) {
        // eslint-disable-next-line
        console.log(chalk.red(e.message));
        process.exit(1);
    }

    const tgzName = (await asyncExecuteCommand(`npm pack ${destination}/${name}`)).trim();
    await asyncRimRaf(`${destination}/${name}`);
    await asyncExtractTar(getTarOptions(tgzName, name));
    unlinkSync(tgzName);
}

buildEverything();
