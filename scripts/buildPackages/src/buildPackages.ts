import { green } from "chalk";
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

interface BuildOptions {
    debug?: boolean;
    cache?: boolean;
    buildOverrides?: string;
}

interface BuildContext {
    [key: string]: boolean;
}

export const buildPackages = async () => {
    const options = yargs.argv as BuildOptions;

    printHardwareReport();

    const { batches, packagesNoCache, allPackages } = await getBatches({
        cache: options.cache ?? true
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

    const tasks = new Listr<BuildContext>(
        batches.map<ListrTask>((packageNames, index) => {
            const id = `${index + 1}`.padStart(2, "0");
            const title = `[${id}/${batches.length}] Batch #${id} (${packageNames.length} packages)`;

            return {
                title,
                task: (ctx, task): Listr => {
                    const packages = allPackages.filter(pkg => packageNames.includes(pkg.name));

                    const batchTasks = task.newListr([], {
                        concurrent: !process.env.CI,
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
    await tasks.run(ctx);
    const duration = (Date.now() - start) / 1000;

    console.log(`\nBuild finished in ${green(duration)} seconds.`);
};

const createPackageTask = (pkg: Package, options: BuildOptions, metaJson: MetaJSON) => {
    return {
        title: `${pkg.name}`,
        task: async () => {
            try {
                if (process.env.CI) {
                    await buildPackageInSameProcess(pkg, options.buildOverrides);
                } else {
                    await buildPackageInNewProcess(pkg, options.buildOverrides);
                }

                // Store package hash
                const sourceHash = await getPackageSourceHash(pkg);
                metaJson.packages[pkg.packageJson.name] = { sourceHash };

                await writeJson(META_FILE_PATH, metaJson);
            } catch (err) {
                throw new Error(`[${pkg.packageJson.name}] ${err.message}`);
            }
        }
    };
};

const toMB = (bytes: number) => {
    const formatter = new Intl.NumberFormat("en", { style: "unit", unit: "megabyte" });

    return formatter.format(Math.round(bytes / 1024 / 1024));
};

const printHardwareReport = () => {
    const { cpuCount, cpuName, freeMemory, totalMemory } = getHardwareInfo();
    console.log(
        `Hardware: ${green(cpuCount)} CPUs (${cpuName}); Total Memory: ${green(
            toMB(totalMemory)
        )}; Free Memory: ${green(toMB(freeMemory))}.`
    );
};
