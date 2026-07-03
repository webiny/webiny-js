#!/usr/bin/env node
import "tsx/esm";

import { Cli } from "@webiny/cli-core";
import { registerServerFeatures } from "./dist/registerServerFeatures.js";

const cli = await Cli.init({}, registerServerFeatures);

await cli.run();
