#!/usr/bin/env node
import fs from "fs";
import chalk from "chalk";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Listr, ListrTask } from "listr2";
import { getPackagesWithTests } from "./getPackagesWithTests.js";
import { generateTsConfig, removeTsConfig } from "./generateTsConfig.js";
import { typecheckPackage } from "./typecheckPackage.js";
import { writeReport, REPORT_DIR } from "./writeReport.js";

const { green, red, yellow } = chalk;

const argv = yargs(hideBin(process.argv))
    .option("p", {
        alias: "package",
        type: "string",
        describe: "Folder name(s) to check, comma-separated (e.g. handler-aws,plugins)"
    })
    .option("report", {
        type: "string",
        choices: ["file", "cli"],
        default: "file",
        describe: "Output errors to files in docs/.reports/ or print to CLI"
    })
    .parse() as { p?: string; report: "file" | "cli" };

let packages = getPackagesWithTests();

if (argv.p) {
    const requested = argv.p.split(",").map(s => s.trim());
    packages = packages.filter(pkg => requested.includes(pkg.folderName));

    if (packages.length === 0) {
        console.error(red(`No matching packages found for: ${requested.join(", ")}`));
        process.exit(1);
    }
}

const cleanup = () => {
    for (const pkg of packages) {
        removeTsConfig(pkg.packageFolder);
    }
};

process.on("SIGINT", () => {
    cleanup();
    process.exit(1);
});

process.on("SIGTERM", () => {
    cleanup();
    process.exit(1);
});

for (const pkg of packages) {
    generateTsConfig(pkg.packageFolder);
}

if (argv.report === "file") {
    fs.rmSync(REPORT_DIR, { recursive: true, force: true });
    fs.mkdirSync(REPORT_DIR, { recursive: true });
}

console.log(`\nType-checking tests for ${green(packages.length)} packages.\n`);

const results = {
    passed: 0,
    failed: 0,
    totalErrors: 0
};

const cliOutput: string[] = [];

const tasks = new Listr(
    packages.map<ListrTask>(pkg => ({
        title: pkg.packageJson.name,
        task: (_ctx, task) => {
            const output = typecheckPackage(pkg.packageFolder);
            const errorLines = output.split("\n").filter(l => l.includes("error TS"));

            if (errorLines.length > 0) {
                const count = errorLines.length;
                results.failed++;
                results.totalErrors += count;
                task.title = `${red("✖")} ${pkg.packageJson.name} — ${red(count)} errors`;

                if (argv.report === "file") {
                    writeReport(pkg.folderName, errorLines);
                } else {
                    cliOutput.push(`\n${red("✖")} ${pkg.packageJson.name} — ${count} errors\n`);
                    cliOutput.push(...errorLines);
                }
            } else {
                results.passed++;
                task.title = `${green("✔")} ${pkg.packageJson.name}`;
            }
        }
    })),
    {
        concurrent: true,
        rendererOptions: {
            collapseSubtasks: false
        }
    }
);

try {
    await tasks.run();
} finally {
    cleanup();
}

console.log();

if (argv.report === "cli" && cliOutput.length > 0) {
    console.log(cliOutput.join("\n"));
    console.log();
}

console.log(`Results: ${green(results.passed)} passed, ${red(results.failed)} failed`);
console.log(`Total type errors: ${results.totalErrors}`);

if (results.failed > 0 && argv.report === "file") {
    console.log(`Reports written to ${yellow("docs/.reports/")}`);
}
