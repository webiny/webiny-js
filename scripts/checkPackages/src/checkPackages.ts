import chalk from "chalk";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { getPackages } from "../../utils/getPackages";
import { fork } from "child_process";
import path from "path";
import { deserializeError } from "serialize-error";

const { green, red } = chalk;

interface Package {
    isTs: boolean;
    mustBuild: boolean;
    name: string;
    packageFolder: string;
    packageJson: Record<string, any>;
}

interface CheckOptions {
    p?: string | string[];
}

const checkPackage = async (pkg: Package): Promise<void> => {
    const workerPath = path.join(import.meta.dirname, "checkPackageWorker.js");
    const childProcess = fork(workerPath, [], {
        env: process.env,
        cwd: pkg.packageFolder,
        stdio: ["pipe", "pipe", "pipe", "ipc"]
    });

    await new Promise<void>((resolve, reject) => {
        let stderr = "";
        childProcess.stderr?.on("data", chunk => {
            stderr += chunk.toString();
        });

        childProcess.on("message", (message: Record<string, any>) => {
            if (message.type === "error") {
                const error = deserializeError(message.error);
                return reject(error);
            }
            return resolve();
        });

        childProcess.on("exit", code => {
            if (code && code !== 0) {
                reject(new Error(stderr || `Worker exited with code ${code}`));
            }
        });
    });
};

export const checkPackages = async () => {
    const argv = yargs(hideBin(process.argv)).parse() as CheckOptions;

    let packagesWhitelist: string[] = [];
    if (argv.p) {
        packagesWhitelist = Array.isArray(argv.p) ? argv.p : [argv.p];
    }

    let packages = (getPackages({ includes: ["/packages/"] }) as Package[]).filter(
        pkg => pkg.mustBuild
    );

    if (packagesWhitelist.length) {
        packages = packages.filter(pkg => packagesWhitelist.includes(pkg.name));
    }

    if (!packages.length) {
        console.log("No packages to check.");
        return;
    }

    console.log(`Type checking ${green(packages.length)} package(s)...\n`);

    const start = Date.now();
    const errors: { name: string; error: Error }[] = [];

    for (const pkg of packages) {
        try {
            await checkPackage(pkg);
            console.log(`  ${green("✓")} ${pkg.name}`);
        } catch (err: any) {
            console.log(`  ${red("✖")} ${pkg.name}`);
            errors.push({ name: pkg.name, error: err });
        }
    }

    const duration = ((Date.now() - start) / 1000).toFixed(1);

    if (errors.length) {
        console.log(`\n${red("Type check failed")} for ${errors.length} package(s):\n`);
        for (const { name, error } of errors) {
            console.log(red(`✖ ${name}`));
            console.log(error.message);
            console.log();
        }
        process.exit(1);
    }

    console.log(`\nType check passed in ${green(duration + "s")}.`);
};
