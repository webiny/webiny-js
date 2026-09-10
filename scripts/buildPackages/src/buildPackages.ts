import yargs from "yargs";
import { writeJsonFileSync } from "write-json-file";
import { Listr, ListrTask } from "listr2";
import { getBatches } from "./getBatches";
import { META_FILE_PATH } from "./constants";
import { getBuildMeta } from "./getBuildMeta";
import { buildPackage } from "./buildSinglePackage";
import { getHardwareInfo } from "./getHardwareInfo";
import { execa } from "execa";
// @ts-expect-error
import notifier from "toasted-notifier";

import path from "path";
import { hideBin } from "yargs/helpers";
import { PackageBuildError } from "./PackageBuildError";
import { queueMetaWrite } from "./writeMetaQueue";
import { createReporter } from "./reporter";
import { previewBuild } from "./previewBuild";
import { getPackagesWhitelist } from "./getPackagesWhitelist";

const argv = yargs(hideBin(process.argv)).parse();

const projectFolder = path.basename(process.cwd());

const sendNotification = (title: string, message: string) => {
    try {
        notifier.notify({ title, message });
    } catch {
        // Ignore — notification is best-effort (e.g. terminal-notifier may not support this arch).
    }
};

interface BuildOptions {
    p?: string | string[];
    debug?: boolean;
    cache?: boolean;
    buildOverrides?: string;
    safeReplace?: boolean;
    /**
     * Emit newline-delimited JSON progress events on stdout instead of the interactive
     * Listr UI, so an external tool (IDE, CI dashboard) can render its own progress.
     * See `reporter.ts` for the event schema.
     */
    json?: boolean;
    /**
     * Report how many packages are already built and how many need to be (re)built,
     * then exit without building anything. Combine with `--json` to poll it as a
     * status indicator. See `previewBuild.ts`.
     */
    preview?: boolean;
}

interface BuildContext {
    [key: string]: boolean;
}

const buildInParallel =
    !process.env.CI || process.env.RUNNER_NAME?.startsWith("webiny-build-packages") === true;

export const buildPackages = async () => {
    const options = argv as BuildOptions;

    const reporter = createReporter(options.json === true);

    if (options.preview === true) {
        // Nothing below this point runs: a preview reports the plan and stops. Notably,
        // it also skips the `tsc --version` check, which nothing in a preview needs.
        await previewBuild(options, reporter);
        return;
    }

    // Captured rather than inherited: in JSON mode stdout carries the event stream, and
    // in text mode the reporter needs to print this after the hardware report.
    const tscVersion = await execa("yarn", ["tsc", "--version"]);

    const hardware = getHardwareInfo();

    reporter.info({
        projectFolder,
        runner: process.env.RUNNER_NAME || "N/A",
        parallel: buildInParallel,
        ...hardware,
        tscVersion: tscVersion.stdout?.trim() ?? ""
    });

    const packagesWhitelist = getPackagesWhitelist(options.p);

    const {
        batches,
        packagesNoCache,
        packagesUseCache,
        restoredFromCache,
        cacheEnabled,
        allPackages,
        buildKeys
    } = await getBatches({
        cache: options.cache ?? true,
        packagesWhitelist
    });

    const start = Date.now();

    reporter.plan({
        totalPackages: allPackages.length,
        cacheEnabled,
        packages: packagesNoCache.map(pkg => pkg.packageJson.name),
        cachedPackages: packagesUseCache.map(pkg => pkg.packageJson.name),
        restoredPackages: restoredFromCache.map(pkg => pkg.packageJson.name),
        // A single package is built directly, without batching.
        batches: allPackages.length === 1 ? 0 : batches.length
    });

    if (!packagesNoCache.length) {
        reporter.end({ success: true, duration: 0, built: 0, failed: 0, errors: [] });
        return;
    }

    if (allPackages.length === 1) {
        const [pkg] = allPackages;

        reporter.packageStart(pkg.packageJson.name, 0);

        try {
            await buildPackage(
                pkg,
                options.buildOverrides,
                reporter.machineReadable ? undefined : "inherit",
                options.safeReplace
            );

            // Record the dependency-aware build key so a later build treats this
            // package as a cache hit (the cache→dist copy is then skipped when
            // dist already matches — content hash).
            const meta = getBuildMeta();
            meta.packages[pkg.packageJson.name] = {
                sourceHash: buildKeys.get(pkg.name) ?? ""
            };
            writeJsonFileSync(META_FILE_PATH, meta);

            const duration = Date.now() - start;
            reporter.packageEnd({ name: pkg.packageJson.name, batch: 0, duration });

            sendNotification(`Webiny Build (${projectFolder})`, "Build completed successfully");

            reporter.end({
                success: true,
                duration: duration / 1000,
                built: 1,
                failed: 0,
                errors: []
            });
        } catch (err) {
            const error = err as Error;
            const duration = Date.now() - start;

            reporter.packageEnd({
                name: pkg.packageJson.name,
                batch: 0,
                duration,
                error: error.message
            });

            sendNotification(`Webiny Build (${projectFolder})`, "Build failed");

            reporter.end({
                success: false,
                duration: duration / 1000,
                built: 0,
                failed: 1,
                errors: [{ name: pkg.packageJson.name, message: error.message }]
            });

            // In JSON mode the failure is already fully described by the event stream,
            // so rethrowing would only add an unparseable stack trace to the output.
            if (reporter.machineReadable) {
                process.exit(1);
            }

            throw err;
        }

        return;
    }

    const totalBatches = `${batches.length}`.padStart(2, "0");

    // A failure in any batch skips every later batch, so the packages in them never
    // report a result. Tracked here so the final report can account for all of them.
    const succeededPackages = new Set<string>();
    const failedPackages = new Set<string>();
    const skipReported = new Set<number>();

    const tasks = new Listr<BuildContext>(
        batches.map<ListrTask>((packageNames, index) => {
            const batchNumber = index + 1;
            const id = `${batchNumber}`.padStart(2, "0");
            const title = `[${id}/${totalBatches}] Batch #${id} (${packageNames.length} packages)`;

            const packages = allPackages.filter(pkg => packageNames.includes(pkg.name));

            const batchInfo = {
                batch: batchNumber,
                totalBatches: batches.length,
                packages: packages.map(pkg => pkg.packageJson.name)
            };

            return {
                title,
                skip: ctx => {
                    if (!ctx.skip) {
                        return false;
                    }

                    // `skip` may be consulted more than once — report the batch only once.
                    if (!skipReported.has(batchNumber)) {
                        skipReported.add(batchNumber);
                        reporter.batchSkipped(batchInfo);
                    }

                    return true;
                },
                task: async (ctx, task) => {
                    const batchStart = Date.now();
                    let succeeded = 0;
                    let failed = 0;

                    reporter.batchStart(batchInfo);

                    const subtasks = packages.map(pkg => {
                        return {
                            title: `${pkg.name}`,
                            task: async () => {
                                const packageStart = Date.now();

                                reporter.packageStart(pkg.packageJson.name, batchNumber);

                                try {
                                    await buildPackage(
                                        pkg,
                                        options.buildOverrides,
                                        undefined,
                                        options.safeReplace
                                    );

                                    // Store the dependency-aware build key.
                                    const key = buildKeys.get(pkg.name) ?? "";
                                    await queueMetaWrite(async () => {
                                        const currentMeta = getBuildMeta();
                                        currentMeta.packages[pkg.packageJson.name] = {
                                            sourceHash: key
                                        };
                                        return writeJsonFileSync(META_FILE_PATH, currentMeta);
                                    });

                                    succeeded++;
                                    succeededPackages.add(pkg.packageJson.name);
                                    reporter.packageEnd({
                                        name: pkg.packageJson.name,
                                        batch: batchNumber,
                                        duration: Date.now() - packageStart
                                    });
                                } catch (err) {
                                    failed++;
                                    failedPackages.add(pkg.packageJson.name);
                                    reporter.packageEnd({
                                        name: pkg.packageJson.name,
                                        batch: batchNumber,
                                        duration: Date.now() - packageStart,
                                        error: (err as Error).message
                                    });

                                    ctx.skip = true;
                                    throw new PackageBuildError(pkg, err as Error);
                                }
                            }
                        };
                    });

                    const subtaskList = task.newListr(subtasks, {
                        concurrent: buildInParallel,
                        exitOnError: false,
                        collectErrors: true,
                        rendererOptions: { showErrorMessage: false }
                    });

                    // Run the subtasks here rather than returning the list, so the batch's
                    // own totals are known by the time `batchEnd` is reported. `exitOnError`
                    // is off, so this never throws — errors surface on `tasks.errors`.
                    try {
                        await subtaskList.run();
                    } finally {
                        reporter.batchEnd({
                            ...batchInfo,
                            succeeded,
                            failed,
                            duration: Date.now() - batchStart
                        });
                    }
                }
            };
        }),
        {
            concurrent: false,
            collectErrors: true,
            // Suppresses the interactive UI for this list and all of its subtasks, leaving
            // the JSON reporter as the only thing writing to stdout.
            silentRendererCondition: reporter.machineReadable,
            rendererOptions: {
                timer: {
                    condition: true,
                    field: duration => {
                        return `${Math.round(duration / 1000)}s`;
                    },
                    format: () => {
                        return time => {
                            return time || "";
                        };
                    }
                },
                collapseSubtasks: true
            }
        }
    );

    await tasks.run();

    const duration = (Date.now() - start) / 1000;

    if (tasks.errors?.length) {
        const errors = tasks.errors.map(listrError => {
            const pkgBuildError = listrError.error as PackageBuildError;
            return {
                name: pkgBuildError.getPackage().name,
                message: pkgBuildError.getBuildError().message
            };
        });

        sendNotification(
            `Webiny Build (${projectFolder})`,
            `Build failed after ${duration} seconds`
        );

        // Packages in the batches that got skipped never ran, so they count as neither
        // built nor failed.
        const skippedPackages = packagesNoCache
            .map(pkg => pkg.packageJson.name)
            .filter(name => !succeededPackages.has(name) && !failedPackages.has(name));

        reporter.end({
            success: false,
            duration,
            built: succeededPackages.size,
            failed: failedPackages.size,
            skipped: skippedPackages.length,
            skippedPackages,
            errors
        });

        process.exit(1);
    }

    sendNotification(`Webiny Build (${projectFolder})`, `Build finished in ${duration} seconds`);

    reporter.end({
        success: true,
        duration,
        built: succeededPackages.size,
        failed: 0,
        skipped: 0,
        skippedPackages: [],
        errors: []
    });
};
