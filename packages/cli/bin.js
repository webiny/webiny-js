#!/usr/bin/env node
import "tsx/esm";

// Suppress punycode warnings. This is a known issue we can't fix.
import "./utils/suppressPunycodeWarnings.js";

import { Cli } from "@webiny/cli-core";
import { ensureSystemRequirements } from "@webiny/system-requirements";

// Ensure system requirements are met.
ensureSystemRequirements();

const cli = await Cli.init();

await cli.run();
