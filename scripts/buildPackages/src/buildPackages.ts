import chalk from "chalk";
import yargs from "yargs";
import { writeJsonFileSync } from "write-json-file";
import { Listr, ListrTask } from "listr2";
import { getBatches } from "./getBatches";
import { META_FILE_PATH } from "./constants";
import { getPackageSourceHash } from "./getPackageSourceHash";
import { getBuildMeta } from "./getBuildMeta";
import { buildPackage } from "./buildSinglePackage";
import { getHardwareInfo } from "./getHardwareInfo";
import execa from "execa";

import { hideBin } from "yargs/helpers";
import { PackageBuildError } from "./PackageBuildError";
import { queueMetaWrite } from "./writeMetaQueue";

const argv = yargs(hideBin(process.argv)).parse();

const { green, red } = chalk;

interface BuildOptions {
    p?: string | string[];
    debug?: boolean;
    cache?: boolean;
    buildOverrides?: string;
}

interface BuildContext {
    [key: string]: boolean;
}

const buildInParallel =
    !process.env.CI || process.env.RUNNER_NAME?.startsWith("webiny-build-packages");

export const buildPackages = async () => {
    const options = argv as BuildOptions;

    printHardwareReport();

    console.log("Check Typescript");
    await execa("yarn", ["tsc", "--version"], { stdio: "inherit" });

    let packagesWhitelist: string[] = [];
    if (options.p) {
        if (Array.isArray(options.p)) {
            packagesWhitelist = options.p;
        } else {
            packagesWhitelist = [options.p];
        }
    }

    const { batches, packagesNoCache, allPackages } = await getBatches({
        cache: options.cache ?? true,
        packagesWhitelist
    });

    if (!packagesNoCache.length) {
        console.log("There are no packages that need to be built.");
        return;
    }

    if (packagesNoCache.length > 10) {
        console.log(`\nRunning build for ${green(packagesNoCache.length)} packages.`);
    } else {
        console.log("\nRunning build for the following package(s):");
        for (let i = 0; i < packagesNoCache.length; i++) {
            const item = packagesNoCache[i];
            console.log(`‣ ${green(item.packageJson.name)}`);
        }
    }

    if (allPackages.length === 1) {
        const [pkg] = allPackages;
        await buildPackage(pkg, options.buildOverrides, "inherit");
    } else {
        const start = Date.now();

        console.log(
            `\nThe build process will be performed in ${green(batches.length)} ${
                batches.length > 1 ? "batches" : "batch"
            }.\n`
        );
        const metaJson = getBuildMeta();

        const totalBatches = `${batches.length}`.padStart(2, "0");

        const tasks = new Listr<BuildContext>(
            batches.map<ListrTask>((packageNames, index) => {
                const id = `${index + 1}`.padStart(2, "0");
                const title = `[${id}/${totalBatches}] Batch #${id} (${packageNames.length} packages)`;

                return {
                    title,
                    skip: ctx => ctx.skip,
                    task: (ctx, task): Listr => {
                        const packages = allPackages.filter(pkg => packageNames.includes(pkg.name));

                        const subtasks = packages.map(pkg => {
                            return {
                                title: `${pkg.name}`,
                                task: async () => {
                                    try {
                                        await buildPackage(pkg, options.buildOverrides);

                                        // Store package hash
                                        const sourceHash = await getPackageSourceHash(pkg);
                                        await queueMetaWrite(async () => {
                                            const currentMeta = getBuildMeta();
                                            currentMeta.packages[pkg.packageJson.name] = {
                                                sourceHash
                                            };
                                            return writeJsonFileSync(META_FILE_PATH, currentMeta);
                                        });
                                    } catch (err) {
                                        ctx.skip = true;
                                        throw new PackageBuildError(pkg, err);
                                    }
                                }
                            };
                        });

                        const batchTasks = task.newListr(subtasks, {
                            concurrent: buildInParallel,
                            exitOnError: false,
                            rendererOptions: { showErrorMessage: false }
                        });

                        return batchTasks;
                    }
                };
            }),
            {
                concurrent: false,
                rendererOptions: { showTimer: true, collapse: true }
            }
        );

        await tasks.run();

        const duration = (Date.now() - start) / 1000;

        if (tasks.err.length) {
            console.log();
            console.log(
                `Error building ${red(tasks.err.length)} package(s). Check the logs below.`
            );
            console.log();

            tasks.err.forEach(listrError => {
                const pkgBuildError = listrError.error as PackageBuildError;
                console.log(red("✖ " + pkgBuildError.getPackage().name));
                console.log(pkgBuildError.getBuildError().message);
                // TODO remove
                console.log(pkgBuildError.getBuildError());
                console.log();
            });

            console.log(`Build failed in ${red(duration)} seconds.`);
            process.exit(1);
        }

        console.log(`\nBuild finished in ${green(duration)} seconds.`);
    }
};

const toMB = (bytes: number) => {
    const formatter = new Intl.NumberFormat("en", { style: "unit", unit: "megabyte" });

    return formatter.format(Math.round(bytes / 1024 / 1024));
};

const printHardwareReport = () => {
    const { cpuCount, cpuName, freeMemory, totalMemory } = getHardwareInfo();
    console.log(
        `Runner: ${green(process.env.RUNNER_NAME || "N/A")}; Build packages: ${
            buildInParallel ? green("in parallel") : green("in series")
        }; Hardware: ${green(cpuCount)} CPUs (${cpuName}); Total Memory: ${green(
            toMB(totalMemory)
        )}; Free Memory: ${green(toMB(freeMemory))}.`
    );
};
