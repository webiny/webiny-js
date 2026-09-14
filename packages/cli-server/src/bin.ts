#!/usr/bin/env node
import "tsx/esm";

// Suppress punycode warnings. This is a known issue we can't fix.
import "@webiny/cli-core/utils/suppressPunycodeWarnings.js";

import { Cli } from "@webiny/cli-core";
import { ensureSameWebinyPackageVersions } from "@webiny/cli-core/utils/ensureSameWebinyPackageVersions.js";
import { registerServerFeatures } from "./registerServerFeatures.js";

// Hosting-type marker — lets webiny.config.tsx branch on which CLI is running (e.g. SelfHostedAuth +
// Admin.ApiUrl for server, Cognito for AWS). Read at build/watch time when the config is evaluated.
process.env.WEBINY_HOSTING_TYPE = "server";

// Ensure all @webiny/* packages use the same version.
ensureSameWebinyPackageVersions();

const cli = await Cli.init({}, registerServerFeatures);

await cli.run();
