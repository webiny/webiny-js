/*
 * Shared by the `configure*.js` scripts that prepare a scaffolded E2E project before its build:
 * adds an import and a few extension lines to its webiny.config.tsx, and writes any files those
 * lines point at.
 *
 * It EDITS what cwp generated rather than replacing it with a checked-in fixture. A fixture would
 * drift: someone edits `_templates/aws/ddb/webiny.config.tsx`, E2E keeps deploying its own stale
 * copy, every job stays green, and the regression ships. E2E exists to prove that what cwp produces
 * actually deploys, so it has to run the file cwp produced.
 *
 * The project path is the script's first argument, absolute (see createConfigureTestProjectSteps).
 */

import fs from "node:fs";
import path from "node:path";

/**
 * @param {object} params
 * @param {string} params.script The calling script's file name, for the usage message.
 * @param {string} params.name What the lines add, for the log: "the bug reporter".
 * @param {string} params.importLine The import the lines need. Skipped if the config already has it.
 * @param {string[]} params.componentLines Inserted at the top of the extension list.
 * @param {string} params.marker Text whose presence means the config is already done.
 * @param {Record<string, string>} [params.files] Files to write, by path relative to the project.
 */
export function addToWebinyConfig({
    script,
    name,
    importLine,
    componentLines,
    marker,
    files = {}
}) {
    const [projectPath] = process.argv.slice(2);

    if (!projectPath) {
        fail(`No project path given. Usage: node ${script} '<project path>'`);
    }

    const configPath = path.join(projectPath, "webiny.config.tsx");

    if (!fs.existsSync(configPath)) {
        fail(`${configPath} does not exist. Was the project scaffolded?`);
    }

    for (const [file, contents] of Object.entries(files)) {
        const filePath = path.join(projectPath, file);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, contents);
        console.log(`Wrote ${filePath}.`);
    }

    const source = fs.readFileSync(configPath, "utf8");

    // Idempotent, so a re-run cannot add the lines twice.
    if (source.includes(marker)) {
        console.log(`${configPath} already has ${name}, leaving it alone.`);
        return;
    }

    const lines = source.split("\n");

    /*
     * After the LAST import rather than the first, so the imports stay contiguous. The standalone
     * templates carry comments between theirs, and inserting after line 1 would split the block.
     */
    const lastImport = lines.findLastIndex(line => line.startsWith("import "));
    if (lastImport === -1) {
        fail(`${configPath} has no import statement to insert after.`, source);
    }

    // The fragment opening the extension list. Every template has it on its own line.
    const fragment = lines.findIndex(line => line.trim() === "<>");
    if (fragment === -1) {
        fail(`${configPath} has no <> fragment to insert into.`, source);
    }

    const indent = " ".repeat(lines[fragment].length - lines[fragment].trimStart().length + 4);

    // Fragment first: inserting the import shifts every index below it.
    lines.splice(fragment + 1, 0, ...componentLines.map(line => `${indent}${line}`));
    if (!lines.includes(importLine)) {
        lines.splice(lastImport + 1, 0, importLine);
    }

    const result = lines.join("\n");
    fs.writeFileSync(configPath, result);

    console.log(`Added ${name} to ${configPath}:\n`);
    console.log(result);

    /*
     * Loudly, and with the file in the log. A template reshaped so the anchors no longer match
     * should fail the job then and there, not build a project quietly missing the lines.
     */
    function fail(message, contents) {
        console.error(message);
        if (contents) {
            console.error(`\n--- ${configPath} ---\n${contents}`);
        }
        process.exit(1);
    }
}
