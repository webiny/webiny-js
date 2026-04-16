import os from "os";
import execa, { ExecaChildProcess } from "execa";
import * as path from "path";
import fs from "fs-extra";
import merge from "lodash/merge.js";
import kebabCase from "lodash/kebabCase.js";
import set from "lodash/set.js";
import downloadBinaries from "./downloadBinaries.js";

type Command = string | string[];

export interface PulumiArgs {
    [key: string]: string | boolean | undefined | string[];
}

export interface ExecaArgs {
    env?: {
        [key: string]: string | undefined;
    };

    [key: string]: any;
}

export interface Options {
    args?: PulumiArgs;
    execa?: ExecaArgs;
    beforePulumiInstall?: () => any;
    afterPulumiInstall?: () => any;

    // A folder into which the Pulumi CLI, along with all of its meta data and config files, will be set up.
    // It's recommended this folder is not checked in into a code repository, since the Pulumi CLI can store
    // sensitive information here, for example - user's Pulumi Service credentials.
    pulumiFolder?: string;
}

export interface RunArgs {
    command: Command;
    args?: PulumiArgs;
    execa?: ExecaArgs;
    beforePulumiInstall?: () => any;
    afterPulumiInstall?: () => any;
}

export interface InstallArgs {
    beforePulumiInstall?: () => any;
    afterPulumiInstall?: () => any;
}

export const FLAG_NON_INTERACTIVE = "--non-interactive";

export class PulumiError extends Error {}

export class Pulumi {
    options: Options;
    pulumiFolder: string;
    pulumiDownloadFolder: string;
    pulumiBinaryPath: string;

    static async create(options: Options = {}) {
        const pulumi = new Pulumi(options);
        // If not already installed, Pulumi binaries will be downloaded in this step.
        await pulumi.install();
        // No matter if it's a fresh installation or not, we make sure that Pulumi AWS plugin is installed.
        await pulumi.ensureAwsPluginIsInstalled();
        return pulumi;
    }

    private constructor(options: Options = {}) {
        this.options = options;

        this.pulumiDownloadFolder = path.join(
            options.pulumiFolder || process.cwd(),
            "pulumi-cli",
            os.platform()
        );

        this.pulumiFolder = path.join(this.pulumiDownloadFolder, "pulumi");
        this.pulumiBinaryPath = path.join(this.pulumiFolder, "pulumi");
    }

    run(rawArgs: RunArgs) {
        const args = merge({}, this.options, rawArgs);

        if (!Array.isArray(args.command)) {
            args.command = [args.command];
        }

        // 1. Prepare Pulumi args.
        const finalArgs = [];
        for (const key in args.args) {
            const value = args.args[key];
            if (!value) {
                continue;
            }

            if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    finalArgs.push(`--${kebabCase(key)}`, value[i]);
                }
                continue;
            }

            if (typeof value === "boolean") {
                finalArgs.push(`--${kebabCase(key)}`);
                continue;
            }

            finalArgs.push(`--${kebabCase(key)}`, value);
        }

        // Prepare execa args.
        if (!args.execa) {
            args.execa = {};
        }

        set(args.execa, "env.PULUMI_SKIP_UPDATE_CHECK", "true");
        set(args.execa, "env.PULUMI_HOME", this.pulumiFolder);

        if (os.arch() === "arm64") {
            /**
             * This variable is an attempt to resolve this issue:
             * https://yaleman.org/post/2021/2021-01-01-apple-m1-terraform-and-golang/
             */
            set(args.execa, "env.GODEBUG", "asyncpreemptoff=1");
        }

        // Use ";" when on Windows. For Mac and Linux, use ":".
        const PATH_SEPARATOR = os.platform() === "win32" ? ";" : ":";

        const execaArgs = {
            ...args.execa,
            env: {
                ...(args.execa.env || {}),
                /**
                 * Due to an issue with Pulumi https://github.com/pulumi/pulumi/issues/8374, and even though this
                 * commit suggests it should already work like that https://github.com/pulumi/pulumi/commit/c878916901a997a9c0ffcbed23560e19e224a6f1,
                 * we need to specify the exact location of our Pulumi binaries, using the PATH environment variable, so it can correctly resolve
                 * plugins necessary for custom resources and dynamic providers to work.
                 */
                PATH: this.pulumiFolder + PATH_SEPARATOR + process.env.PATH
            }
        };

        // We want to keep the "interactive" output format of the Pulumi command when `--preview` flag is passed in.
        const flags =
            args.command && args.command.includes("preview") ? [] : [FLAG_NON_INTERACTIVE];

        const pulumiProcess = execa(
            this.pulumiBinaryPath,
            [...args.command, ...finalArgs, ...flags],
            execaArgs
        );

        // We want to throw an instance of PulumiError when the Pulumi command fails.
        // Makes it easier to catch and handle Pulumi errors in the code.
        // Note: this code definitely looks funky, but it is because how `execa` works.
        const wrapped = pulumiProcess.then(
            result => result,
            err => {
                throw new PulumiError(err.stderr || err.stdout || err.message, { cause: err });
            }
        );

        Object.assign(wrapped, pulumiProcess);

        return wrapped as ExecaChildProcess<string>;
    }

    private async install(rawArgs?: InstallArgs): Promise<boolean> {
        const args = merge({}, this.options, rawArgs);

        return await downloadBinaries(
            this.pulumiDownloadFolder,
            args.beforePulumiInstall,
            args.afterPulumiInstall
        );
    }

    private async ensureAwsPluginIsInstalled() {
        let pulumiAwsVersion = "";
        const { stdout } = execa.sync("yarn", [
            "info",
            "@pulumi/aws",
            "-A",
            "-R",
            "--name-only",
            "--json"
        ]);

        const match = stdout.match(/npm:(.*?)"/);
        if (match) {
            pulumiAwsVersion = match[1];
        }

        if (!pulumiAwsVersion) {
            throw new PulumiError(
                "Could not determine the version of @pulumi/aws package. Please ensure it is installed."
            );
        }

        const pluginsDir = path.join(this.pulumiFolder, "plugins");
        // Pulumi names plugin directories with a "v" prefix (e.g. resource-aws-v7.25.0).
        const requiredPluginDir = `resource-aws-v${pulumiAwsVersion}`;

        const pluginExists = fs.pathExistsSync(
            path.join(pluginsDir, requiredPluginDir, "pulumi-resource-aws")
        );

        if (!pluginExists) {
            execa.sync(
                this.pulumiBinaryPath,
                ["plugin", "install", "resource", "aws", pulumiAwsVersion],
                {
                    stdio: "inherit",
                    env: {
                        PULUMI_HOME: this.pulumiFolder,
                        PULUMI_SKIP_UPDATE_CHECK: "true"
                    }
                }
            );
        }

        // Remove stale resource-aws plugin versions to reclaim disk space.
        if (fs.pathExistsSync(pluginsDir)) {
            for (const entry of fs.readdirSync(pluginsDir)) {
                if (!entry.startsWith("resource-aws-") || entry === requiredPluginDir) {
                    continue;
                }
                // Strip the trailing ".lock" suffix so both the directory and its
                // lock file are matched by the same prefix check.
                const baseName = entry.endsWith(".lock") ? entry.slice(0, -5) : entry;
                if (baseName !== requiredPluginDir) {
                    console.log("DERI", entry);
                    fs.removeSync(path.join(pluginsDir, entry));
                }
            }
        }
    }
}
