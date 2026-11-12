/*
 * Adds `<Project.BugReporter>` to a scaffolded project's webiny.config.tsx.
 *
 * E2E gets the reporter for free - DefaultExtensions puts `<BugReporter />` in every project - but
 * always in compose mode: with no token it only builds a prefilled issues/new URL and files nothing.
 * This is what switches it to filing. It has to run after `create-webiny-project` and before the
 * build, because both values are read while the API bundle is built, not at runtime.
 *
 * Usage: node configureBugReporter.js '<absolute path to the scaffolded project>'.
 */

import { addToWebinyConfig } from "./configureProject/addToWebinyConfig.js";

addToWebinyConfig({
    script: "configureBugReporter.js",
    name: "the bug reporter",
    importLine: 'import { Project } from "webiny/extensions";',
    /*
     * Left on `process.env` rather than baked in, so what E2E deploys is the setup a real project
     * would write. Unset means both params come through empty, the extension emits no build param,
     * and the reporter stays in compose mode.
     *
     * The `|| ""` is load bearing, not style. Reading an unset key off `process.env` while the
     * config renders does not give you `undefined`, it gives an object, which fails the extension's
     * string schema and takes the whole build down. Every template guards its env reads the same way.
     */
    componentLines: [
        '<Project.BugReporter token={process.env.BUG_REPORT_GITHUB_TOKEN || ""} repository={process.env.BUG_REPORT_REPOSITORY || ""} />'
    ],
    marker: "Project.BugReporter"
});
