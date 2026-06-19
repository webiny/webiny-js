#!/usr/bin/env node
import fs from "fs";
import chalk from "chalk";
import { Listr, ListrTask } from "listr2";
import { getPackagesWithTests } from "./getPackagesWithTests.js";
import { typecheckPackage } from "./typecheckPackage.js";
import { writeReport, REPORT_DIR } from "./writeReport.js";

const { green, red, yellow } = chalk;

const packages = getPackagesWithTests();

fs.rmSync(REPORT_DIR, { recursive: true, force: true });
fs.mkdirSync(REPORT_DIR, { recursive: true });

console.log(`\nType-checking tests for ${green(packages.length)} packages.\n`);

const results = {
    passed: 0,
    failed: 0,
    totalErrors: 0
};

const tasks = new Listr(
    packages.map<ListrTask>(pkg => ({
        title: pkg.packageJson.name,
        task: (_ctx, task) => {
            const output = typecheckPackage(pkg.packageFolder);
            const errorLines = output.split("\n").filter(l => l.includes("error TS"));

            if (errorLines.length > 0) {
                const count = writeReport(pkg.folderName, errorLines);
                results.failed++;
                results.totalErrors += count;
                task.title = `${red("✖")} ${pkg.packageJson.name} — ${red(count)} errors`;
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

await tasks.run();

console.log();
console.log(`Results: ${green(results.passed)} passed, ${red(results.failed)} failed`);
console.log(`Total type errors: ${results.totalErrors}`);

if (results.failed > 0) {
    console.log(`Reports written to ${yellow("docs/.reports/")}`);
}
