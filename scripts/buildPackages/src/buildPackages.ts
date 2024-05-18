import { green, red } from "chalk";
import yargs from "yargs";
import writeJson from "write-json-file";
import { Listr, ListrTask } from "listr2";
import { getBatches } from "./getBatches";
import { META_FILE_PATH } from "./constants";
import { getPackageSourceHash } from "./getPackageSourceHash";
import { getBuildMeta } from "./getBuildMeta";
import { buildPackageInNewProcess, buildPackageInSameProcess } from "./buildSinglePackage";
import { MetaJSON, Package } from "./types";
import { getHardwareInfo } from "./getHardwareInfo";
import execa from "execa";

class BuildError extends Error {
    private workspace: string;

    constructor(workspace: string, message: string) {
        super("BuildError");
        this.workspace = workspace;
        this.message = message;
    }
}

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
    const options = yargs.argv as BuildOptions;

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
        console.log("\nRunning build for the following packages:");
        for (let i = 0; i < packagesNoCache.length; i++) {
            const item = packagesNoCache[i];
            console.log(`‣ ${green(item.packageJson.name)}`);
        }
    }

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
                task: (ctx, task): Listr => {
                    const packages = allPackages.filter(pkg => packageNames.includes(pkg.name));

                    const batchTasks = task.newListr([], {
                        concurrent: buildInParallel,
                        exitOnError: true
                    });

                    packages.forEach(pkg => {
                        batchTasks.add(createPackageTask(pkg, options, metaJson));
                    });

                    return batchTasks;
                }
            };
        }),
        { concurrent: false, rendererOptions: { showTimer: true, collapse: true } }
    );

    const start = Date.now();
    const ctx = {};
    try {
        await tasks.run(ctx);
    } catch (err) {
        console.log(`\nError building ${red(err.workspace)}:\n`);
        console.log(red(err.message));
        process.exit(1);
    }
    const duration = (Date.now() - start) / 1000;

    console.log(`\nBuild finished in ${green(duration)} seconds.`);
};

const createPackageTask = (pkg: Package, options: BuildOptions, metaJson: MetaJSON) => {
    return {
        title: `${pkg.name}`,
        task: async () => {
            try {
                if (!buildInParallel) {
                    await buildPackageInSameProcess(pkg, options.buildOverrides);
                } else {
                    await buildPackageInNewProcess(pkg, options.buildOverrides);
                }

                // Store package hash
                const sourceHash = await getPackageSourceHash(pkg);
                metaJson.packages[pkg.packageJson.name] = { sourceHash };

                await writeJson(META_FILE_PATH, metaJson);
            } catch (err) {
                throw new BuildError(pkg.packageJson.name, getCleanError(err.message));
            }
        }
    };
};

const getCleanError = (log: string) => {
    const lines = log.split("\n");
    const index = lines.findIndex(line => line.startsWith("webiny error"));
    if (index > -1) {
        lines[index] = lines[index].replace("webiny error: ", "");
        return lines.slice(index).join("\n");
    }
    return log;
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
