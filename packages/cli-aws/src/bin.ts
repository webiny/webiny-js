#!/usr/bin/env node
import "tsx/esm";

// Suppress punycode warnings. This is a known issue we can't fix.
import "@webiny/cli-core/utils/suppressPunycodeWarnings.js";

import { Cli } from "@webiny/cli-core";
import { ensureSameWebinyPackageVersions } from "@webiny/cli-core/utils/ensureSameWebinyPackageVersions.js";
import { registerAwsFeatures } from "./index.js";
import { ensureSystemRequirements } from "@webiny/system-requirements";
import { startTrace } from "@webiny/project/utils/trace/index.js";
import { trace } from "@webiny/project/utils/trace/index.js";
import { traceAsync } from "@webiny/project/utils/trace/index.js";

// Time the run when `--trace` or `WEBINY_CLI_TRACE=1` is used. Must be the first statement, so that
// the time spent loading the imports above is attributed.
startTrace("Webiny CLI (aws)");

// Hosting-type marker — lets webiny.config.tsx branch on which CLI is running (e.g. Cognito for AWS,
// SelfHostedAuth + Admin.ApiUrl for server). Read at build/watch time when the config is evaluated.
process.env.WEBINY_HOSTING_TYPE = "aws";

// Ensure system requirements are met.
trace("check system requirements", () => ensureSystemRequirements());

// Ensure all @webiny/* packages use the same version.
trace("check @webiny package versions", () => ensureSameWebinyPackageVersions());

const cli = await traceAsync("initialize CLI", () => Cli.init({}, registerAwsFeatures));

await traceAsync("run command", () => cli.run());
