// @flow
const { unlinkSync, existsSync } = require("fs");
const chalk = require("chalk");
const listPackages = require("./utils/listPackages");
const {
    asyncCopyTo,
    asyncExecuteCommand,
    asyncExtractTar,
    asyncRimRaf
} = require("./utils/packaging");

const buildPath = require("./utils/buildPath");

async function buildEverything() {
    // eslint-disable-next-line
    console.log(chalk.green("Build process started."));
    // eslint-disable-next-line
    console.log(chalk.green("Please remain patient while all packages are being built."));

    // Delete the folder so we always have a fresh start.
    await asyncRimRaf("build");

    // Build all packages, one by one.
    const packages = listPackages();
    await Promise.all(
        packages.map(name => {
            return (async () => {
                // eslint-disable-next-line
                await asyncExecuteCommand(
                    `node ../../node_modules/.bin/babel src -d ../../${buildPath}/${name} --copy-files`,
                    {
                        cwd: `packages/${name}`
                    }
                );

                if (existsSync(`bin`)) {
                    await asyncExecuteCommand(
                        `node ../../node_modules/.bin/babel bin -d ../../${buildPath}/${name}/bin --copy-files`,
                        {
                            cwd: `packages/${name}`
                        }
                    );
                }

                // Create (simulate) NPM packages.
                await prepareNpmPackage(name);

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
        dest: `${buildPath}/${packageName}`,
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

async function prepareNpmPackage(name) {
    try {
        await Promise.all([
            asyncCopyTo("LICENSE", `${buildPath}/${name}/LICENSE`),
            asyncCopyTo(`packages/${name}/package.json`, `${buildPath}/${name}/package.json`),

            (async () => {
                if (!existsSync(`packages/${name}/README.md`)) {
                    throw Error(`Missing README.md file in "${name}" package.`);
                }
                await asyncCopyTo(`packages/${name}/README.md`, `${buildPath}/${name}/README.md`);
            })()
        ]);
    } catch (e) {
        // eslint-disable-next-line
        console.log(chalk.red(e.message));
        process.exit(1);
    }

    const tgzName = (await asyncExecuteCommand(`npm pack ${buildPath}/${name}`)).trim();
    await asyncRimRaf(`${buildPath}/${name}`);
    await asyncExtractTar(getTarOptions(tgzName, name));
    unlinkSync(tgzName);
}

buildEverything();
