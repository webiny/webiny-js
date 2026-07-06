#!/usr/bin/env node
import "tsx/esm";

// Suppress punycode warnings. This is a known issue we can't fix.
import "@webiny/cli-core/utils/suppressPunycodeWarnings.js";

import { Cli } from "@webiny/cli-core";
import { ensureSameWebinyPackageVersions } from "@webiny/cli-core/utils/ensureSameWebinyPackageVersions.js";
import { registerServerFeatures } from "./dist/registerServerFeatures.js";

// Ensure all @webiny/* packages use the same version.
ensureSameWebinyPackageVersions();

const cli = await Cli.init({}, registerServerFeatures);

await cli.run();
