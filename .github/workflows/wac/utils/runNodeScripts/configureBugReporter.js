// Adds `<BugReporter.GitHub>` to a scaffolded project's webiny.config.tsx.
//
// E2E gets the reporter for free - DefaultExtensions puts `<BugReporter />` in every project - but
// always in compose mode: with no token it only builds a prefilled issues/new URL and files nothing.
// This is what switches it to filing. It has to run after `create-webiny-project` and before the
// build, because both values are read while the API bundle is built, not at runtime.
//
// This EDITS what cwp generated rather than replacing it with a checked-in fixture. A fixture would
// drift: someone edits `_templates/aws/ddb/webiny.config.tsx`, E2E keeps deploying its own stale
// copy, every job stays green, and the regression ships. E2E exists to prove that what cwp produces
// actually deploys, so it has to run the file cwp produced.
//
// Usage: node configureBugReporter.js '<absolute path to the scaffolded project>'

import fs from "node:fs";
import path from "node:path";

const IMPORT_LINE = 'import { BugReporter } from "webiny/extensions";';

// Left on `process.env` rather than baked in, so what E2E deploys is the setup a real project would
// write. Unset means the component emits no build param and the reporter stays in compose mode.
const COMPONENT_LINE =
    "<BugReporter.GitHub token={process.env.BUG_REPORT_GITHUB_TOKEN} repository={process.env.BUG_REPORT_REPOSITORY} />";

const [projectPath] = process.argv.slice(2);

if (!projectPath) {
    fail("No project path given. Usage: node configureBugReporter.js '<project path>'");
}

const configPath = path.join(projectPath, "webiny.config.tsx");

if (!fs.existsSync(configPath)) {
    fail(`${configPath} does not exist. Was the project scaffolded?`);
}

const source = fs.readFileSync(configPath, "utf8");

// Idempotent, so a re-run or a future second call cannot produce two of these.
if (source.includes("BugReporter.GitHub")) {
    console.log(`${configPath} already configures the bug reporter, leaving it alone.`);
    process.exit(0);
}

const lines = source.split("\n");

// After the LAST import rather than the first, so the imports stay contiguous. The standalone
// templates carry comments between theirs, and inserting after line 1 would split the block.
const lastImport = findLastIndex(lines, line => line.startsWith("import "));
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
lines.splice(fragment + 1, 0, `${indent}${COMPONENT_LINE}`);
lines.splice(lastImport + 1, 0, IMPORT_LINE);

const result = lines.join("\n");
fs.writeFileSync(configPath, result);

console.log(`Configured the bug reporter in ${configPath}:\n`);
console.log(result);

function findLastIndex(items, predicate) {
    for (let index = items.length - 1; index >= 0; index--) {
        if (predicate(items[index])) {
            return index;
        }
    }
    return -1;
}

// Loudly, and with the file in the log. A template reshaped so the anchors no longer match should
// fail the job then and there, not deploy a project quietly missing the config.
function fail(message, contents) {
    console.error(message);
    if (contents) {
        console.error(`\n--- ${configPath} ---\n${contents}`);
    }
    process.exit(1);
}
