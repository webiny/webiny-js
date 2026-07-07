#!/usr/bin/env node
import "tsx/esm";

// Suppress punycode warnings. This is a known issue we can't fix.
import "@webiny/cli-core/utils/suppressPunycodeWarnings.js";

import { Cli } from "@webiny/cli-core";
import { ensureSameWebinyPackageVersions } from "@webiny/cli-core/utils/ensureSameWebinyPackageVersions.js";
import { registerAwsFeatures } from "./dist/index.js";
import { ensureSystemRequirements } from "@webiny/system-requirements";

// Flavour marker — lets webiny.config.tsx branch on which CLI is running (e.g. Cognito for AWS,
// SelfHostedAuth + Admin.ApiUrl for server). Read at build/watch time when the config is evaluated.
process.env.WEBINY_FLAVOUR = "aws";

// Ensure system requirements are met.
ensureSystemRequirements();

// Ensure all @webiny/* packages use the same version.
ensureSameWebinyPackageVersions();

const cli = await Cli.init({}, registerAwsFeatures);

await cli.run();
