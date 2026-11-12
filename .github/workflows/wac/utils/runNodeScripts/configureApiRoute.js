/*
 * Adds two `<Api.Route>` entries to a scaffolded project's webiny.config.tsx, and the handler they
 * point at, so E2E can call a custom HTTP route on every hosting type (e2e/tests/apiRoute.e2e.ts).
 *
 * - GET  /e2e/api-route/{id}  checks a path parameter, written in API Gateway's `{id}` syntax.
 * - POST /e2e/api-route       checks a JSON body.
 *
 * Both share one handler file, which is a case the route build used to get wrong: it registered
 * only the first route on a file. The handler echoes what it received, so the test can check what
 * reached it, not only the status code.
 *
 * Like configureBugReporter.js, this EDITS what cwp generated rather than replacing it with a
 * fixture, so E2E keeps building the config cwp produces. It has to run after `create-webiny-project`
 * and before the build: the route is written into the API bundle at build time.
 *
 * Usage: node configureApiRoute.js '<absolute path to the scaffolded project>'.
 */

import fs from "node:fs";
import path from "node:path";

const IMPORT_LINE = 'import { Api } from "webiny/extensions";';

const HANDLER_SRC = "/extensions/E2eApiRoute.ts";

const COMPONENT_LINES = [
    `<Api.Route method={"GET"} path={"/e2e/api-route/{id}"} src={"${HANDLER_SRC}"} />`,
    `<Api.Route method={"POST"} path={"/e2e/api-route"} src={"${HANDLER_SRC}"} />`
];

const HANDLER = `import { HttpRouteHandler } from "webiny/api";

/*
 * Added by E2E (configureApiRoute.js). Echoes the request, so e2e/tests/apiRoute.e2e.ts can check
 * what reached the handler on each hosting type.
 */
class E2eApiRouteImpl implements HttpRouteHandler.Interface {
    async handle(request: HttpRouteHandler.Request, response: HttpRouteHandler.Response) {
        return response.status(200).json({
            route: request.route.name,
            method: request.method,
            pathParameters: request.pathParameters,
            body: request.body ?? null
        });
    }
}

export default HttpRouteHandler.createImplementation({
    implementation: E2eApiRouteImpl,
    dependencies: []
});
`;

const [projectPath] = process.argv.slice(2);

if (!projectPath) {
    fail("No project path given. Usage: node configureApiRoute.js '<project path>'");
}

const configPath = path.join(projectPath, "webiny.config.tsx");

if (!fs.existsSync(configPath)) {
    fail(`${configPath} does not exist. Was the project scaffolded?`);
}

const handlerPath = path.join(projectPath, HANDLER_SRC);
fs.mkdirSync(path.dirname(handlerPath), { recursive: true });
fs.writeFileSync(handlerPath, HANDLER);
console.log(`Wrote ${handlerPath}.`);

const source = fs.readFileSync(configPath, "utf8");

// Idempotent, so a re-run cannot add the routes twice, which would now fail the build.
if (source.includes(HANDLER_SRC)) {
    console.log(`${configPath} already registers the E2E route, leaving it alone.`);
    process.exit(0);
}

const lines = source.split("\n");

// After the LAST import, so the imports stay contiguous (see configureBugReporter.js).
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
const componentLines = COMPONENT_LINES.map(line => `${indent}${line}`);

// Fragment first: inserting the import shifts every index below it.
lines.splice(fragment + 1, 0, ...componentLines);
if (!lines.includes(IMPORT_LINE)) {
    lines.splice(lastImport + 1, 0, IMPORT_LINE);
}

const result = lines.join("\n");
fs.writeFileSync(configPath, result);

console.log(`Registered the E2E route in ${configPath}:\n`);
console.log(result);

/*
 * Loudly, and with the file in the log. A template reshaped so the anchors no longer match should
 * fail the job then and there, not build a project quietly missing the route.
 */
function fail(message, contents) {
    console.error(message);
    if (contents) {
        console.error(`\n--- ${configPath} ---\n${contents}`);
    }
    process.exit(1);
}
