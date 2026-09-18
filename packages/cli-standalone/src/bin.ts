#!/usr/bin/env node
import "tsx/esm";

// Suppress punycode warnings. This is a known issue we can't fix.
import "@webiny/cli-core/utils/suppressPunycodeWarnings.js";

import { Cli } from "@webiny/cli-core";
import { ensureSameWebinyPackageVersions } from "@webiny/cli-core/utils/ensureSameWebinyPackageVersions/index.js";
import { registerStandaloneFeatures } from "./registerStandaloneFeatures.js";
import { startTrace } from "@webiny/project/utils/trace/index.js";
import { trace } from "@webiny/project/utils/trace/index.js";
import { traceAsync } from "@webiny/project/utils/trace/index.js";

// Time the run when `--trace` or `WEBINY_CLI_TRACE=1` is used. Must be the first statement, so that
// the time spent loading the imports above is attributed.
startTrace("Webiny CLI (standalone)");

// Hosting-type marker — lets webiny.config.tsx branch on which CLI is running (e.g. SelfHostedAuth +
// Admin.ApiUrl for server, Cognito for AWS). Read at build/watch time when the config is evaluated.
process.env.WEBINY_HOSTING_TYPE = "standalone";

// Ensure all @webiny/* packages use the same version.
trace("check @webiny package versions", () => ensureSameWebinyPackageVersions());

const cli = await traceAsync("initialize CLI", () => Cli.init({}, registerStandaloneFeatures));

await traceAsync("run command", () => cli.run());
