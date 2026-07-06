#!/usr/bin/env node
import "tsx/esm";

// Suppress punycode warnings. This is a known issue we can't fix.
import "@webiny/cli-core/utils/suppressPunycodeWarnings.js";

import { Cli } from "@webiny/cli-core";
import { ensureSameWebinyPackageVersions } from "@webiny/cli-core/utils/ensureSameWebinyPackageVersions.js";
import { registerAwsFeatures } from "./dist/index.js";
import { ensureSystemRequirements } from "@webiny/system-requirements";

// Ensure system requirements are met.
ensureSystemRequirements();

// Ensure all @webiny/* packages use the same version.
ensureSameWebinyPackageVersions();

const cli = await Cli.init({}, registerAwsFeatures);

await cli.run();
