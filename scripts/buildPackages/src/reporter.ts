import chalk from "chalk";

const { green, red } = chalk;

export interface BuildInfo {
    projectFolder: string;
    runner: string;
    parallel: boolean;
    cpuCount: number;
    cpuName: string;
    totalMemory: number;
    freeMemory: number;
    tscVersion: string;
}

export interface BuildPlan {
    /** Total number of buildable packages in the workspace (after `-p` filtering). */
    totalPackages: number;
    /** Whether the build cache was consulted at all (`--no-cache` turns it off). */
    cacheEnabled: boolean;
    /** Packages that actually need to be built. */
    packages: string[];
    /** Packages served from the build cache. */
    cachedPackages: string[];
    /** Cached packages whose `dist` had to be repopulated from the cache folder. */
    restoredPackages: string[];
    /** Number of batches the build will be performed in. */
    batches: number;
}

export interface BuildPreview {
    /** Total number of buildable packages in the workspace (after `-p` filtering). */
    totalPackages: number;
    /** Whether the build cache was consulted at all (`--no-cache` turns it off). */
    cacheEnabled: boolean;
    /** Packages that are already built — their build key matches the one in the cache. */
    upToDate: number;
    /** How many packages a build would have to (re)build. */
    packagesToBuild: number;
    /** Names of the packages a build would have to (re)build. */
    packages: string[];
    /** Number of batches the build would be performed in. */
    batches: number;
    /** How long the preview itself took, in seconds. */
    duration: number;
}

export interface BatchInfo {
    batch: number;
    totalBatches: number;
    packages: string[];
}

export interface PackageResult {
    name: string;
    batch: number;
    duration: number;
    error?: string;
}

export interface BuildResult {
    success: boolean;
    duration: number;
    built: number;
    failed: number;
    /** Packages that never ran, because an earlier batch failed. */
    skipped: number;
    skippedPackages: string[];
    errors: { name: string; message: string }[];
}

export interface BuildReporter {
    /**
     * `true` when the reporter emits machine-readable output, meaning nothing else
     * is allowed to write to stdout (child process output must be piped, not inherited).
     */
    readonly machineReadable: boolean;

    info(info: BuildInfo): void;
    plan(plan: BuildPlan): void;
    /** The whole output of `--preview`: what a build would do, without doing it. */
    preview(preview: BuildPreview): void;
    batchStart(batch: BatchInfo): void;
    batchEnd(batch: BatchInfo & { succeeded: number; failed: number; duration: number }): void;
    /** A batch was abandoned without running, because an earlier batch failed. */
    batchSkipped(batch: BatchInfo): void;
    packageStart(name: string, batch: number): void;
    packageEnd(result: PackageResult): void;
    end(result: BuildResult): void;
    log(message: string): void;
}

/** Beyond this, `--preview` prints a count instead of the whole list of package names. */
const PREVIEW_PACKAGE_LIST_LIMIT = 20;

const toMB = (bytes: number) => {
    const formatter = new Intl.NumberFormat("en", { style: "unit", unit: "megabyte" });

    return formatter.format(Math.round(bytes / 1024 / 1024));
};

/**
 * Human-readable reporter — reproduces the output the build has always printed.
 * Per-package progress is rendered by Listr, so `batchStart`/`packageEnd` are no-ops here.
 */
class TextReporter implements BuildReporter {
    readonly machineReadable = false;

    private batched = false;

    info(info: BuildInfo) {
        console.log(
            `Runner: ${green(info.runner)}; Build packages: ${
                info.parallel ? green("in parallel") : green("in series")
            }; Hardware: ${green(info.cpuCount)} CPUs (${info.cpuName}); Total Memory: ${green(
                toMB(info.totalMemory)
            )}; Free Memory: ${green(toMB(info.freeMemory))}.`
        );

        console.log("Check Typescript");
        console.log(info.tscVersion);
    }

    plan(plan: BuildPlan) {
        this.batched = plan.batches > 0;

        console.log(`There is a total of ${green(plan.totalPackages)} packages.`);

        if (plan.cachedPackages.length) {
            if (plan.cachedPackages.length > 10) {
                console.log(`Using cache for ${green(plan.cachedPackages.length)} packages.`);
                console.log(
                    `To build all packages regardless of cache, use the ${green(
                        "--no-cache"
                    )} flag.`
                );
            } else {
                console.log("Using cache for following packages:");
                for (const name of plan.cachedPackages) {
                    console.log(green(name));
                }
            }

            if (plan.restoredPackages.length) {
                console.log(
                    `Restored ${green(plan.restoredPackages.length)} package(s) from cache into dist.`
                );
            }
        } else if (plan.cacheEnabled) {
            console.log("Cache is empty, all packages need to be built.");
        } else {
            console.log("Skipping cache.");
        }

        if (!plan.packages.length) {
            console.log("There are no packages that need to be built.");
            return;
        }

        if (plan.packages.length > 10) {
            console.log(`\nRunning build for ${green(plan.packages.length)} packages.`);
        } else {
            console.log("\nRunning build for the following package(s):");
            for (const name of plan.packages) {
                console.log(`‣ ${green(name)}`);
            }
        }

        if (plan.batches > 0) {
            console.log(
                `\nThe build process will be performed in ${green(plan.batches)} ${
                    plan.batches > 1 ? "batches" : "batch"
                }.\n`
            );
        }
    }

    preview(preview: BuildPreview) {
        console.log(`Total packages: ${green(preview.totalPackages)}`);
        console.log(`Already built: ${green(preview.upToDate)}`);
        console.log(
            `Need to be built: ${preview.packagesToBuild ? red(preview.packagesToBuild) : green(0)}`
        );

        if (!preview.cacheEnabled) {
            console.log(`\nCache is off (${green("--no-cache")}), so everything needs a build.`);
        }

        if (preview.packages.length) {
            const shown = preview.packages.slice(0, PREVIEW_PACKAGE_LIST_LIMIT);

            console.log("\nPackages that need to be built:");
            for (const name of shown) {
                console.log(`‣ ${red(name)}`);
            }

            const rest = preview.packages.length - shown.length;
            if (rest > 0) {
                console.log(`…and ${red(rest)} more.`);
            }

            console.log(
                `\nThe build would be performed in ${green(preview.batches)} ${
                    preview.batches === 1 ? "batch" : "batches"
                }.`
            );
        }

        console.log(`\nPreview took ${green(preview.duration)} seconds.`);
    }

    batchStart() {
        // Rendered by Listr.
    }

    batchEnd() {
        // Rendered by Listr.
    }

    batchSkipped() {
        // Rendered by Listr.
    }

    packageStart() {
        // Rendered by Listr.
    }

    packageEnd() {
        // Rendered by Listr.
    }

    end(result: BuildResult) {
        // Only the batched path prints a summary. A single package builds with inherited
        // stdio, so the package's own build output is already the summary — and on failure
        // the error is rethrown and printed by Node. Nothing-to-build says so in `plan`.
        if (!this.batched) {
            return;
        }

        if (!result.success) {
            console.log();
            console.log(`Error building ${red(result.failed)} package(s). Check the logs below.`);
            console.log();

            for (const error of result.errors) {
                console.log(red("✖ " + error.name));
                console.log(error.message);
                console.log();
            }

            console.log(`Build failed in ${red(result.duration)} seconds.`);
            return;
        }

        console.log(`\nBuild finished in ${green(result.duration)} seconds.`);
    }

    log(message: string) {
        console.log(message);
    }
}

/**
 * Machine-readable reporter — writes newline-delimited JSON to stdout, one event per
 * line, so an external tool (IDE, CI dashboard) can drive its own progress UI.
 *
 * Event types, in order of emission:
 *   `build:info`     — hardware/runner/tsc details, once at startup
 *   `build:plan`     — what will be built, what came from cache, how many batches
 *   `batch:start`    — a batch begins
 *   `package:start`  — a package build begins
 *   `package:end`    — a package build finished (`error` set when it failed)
 *   `batch:end`      — a batch finished
 *   `batch:skipped`  — a batch was abandoned without running, an earlier batch having failed
 *   `build:end`      — final result; always emitted, even when nothing was built
 *   `log`            — free-form human message that has no structured equivalent
 *
 * `package:end` and `batch:skipped` both carry `completed`/`total`/`progress`, so a
 * progress bar can be driven without the consumer tracking counts itself, and still
 * reaches 1 when a failure abandons the remaining batches.
 *
 * `--preview` is the exception: it emits a single `build:preview` event and nothing
 * else, so its stdout can be read with a plain `JSON.parse`.
 */
class JsonReporter implements BuildReporter {
    readonly machineReadable = true;

    private total = 0;
    private completed = 0;

    private emit(type: string, payload: Record<string, unknown> = {}) {
        process.stdout.write(JSON.stringify({ type, ts: Date.now(), ...payload }) + "\n");
    }

    info(info: BuildInfo) {
        this.emit("build:info", { ...info });
    }

    plan(plan: BuildPlan) {
        this.total = plan.packages.length;
        this.completed = 0;

        this.emit("build:plan", {
            ...plan,
            packagesToBuild: plan.packages.length,
            packagesFromCache: plan.cachedPackages.length
        });
    }

    preview(preview: BuildPreview) {
        this.emit("build:preview", { ...preview });
    }

    batchStart(batch: BatchInfo) {
        this.emit("batch:start", { ...batch });
    }

    batchEnd(batch: BatchInfo & { succeeded: number; failed: number; duration: number }) {
        this.emit("batch:end", { ...batch });
    }

    batchSkipped(batch: BatchInfo) {
        // Counts the batch's packages as completed, so `progress` still reaches 1 when a
        // failure abandons the rest of the build and a progress bar can't stall mid-way.
        this.completed += batch.packages.length;

        this.emit("batch:skipped", {
            ...batch,
            completed: this.completed,
            total: this.total,
            progress: this.total > 0 ? this.completed / this.total : 1
        });
    }

    packageStart(name: string, batch: number) {
        this.emit("package:start", { name, batch });
    }

    packageEnd(result: PackageResult) {
        this.completed++;

        this.emit("package:end", {
            ...result,
            success: !result.error,
            completed: this.completed,
            total: this.total,
            progress: this.total > 0 ? this.completed / this.total : 1
        });
    }

    end(result: BuildResult) {
        this.emit("build:end", { ...result });
    }

    log(message: string) {
        this.emit("log", { message });
    }
}

export const createReporter = (json: boolean): BuildReporter => {
    return json ? new JsonReporter() : new TextReporter();
};
