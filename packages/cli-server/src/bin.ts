#!/usr/bin/env node
import "tsx/esm";

// Suppress punycode warnings. This is a known issue we can't fix.
import "@webiny/cli-core/utils/suppressPunycodeWarnings.js";

import { Cli } from "@webiny/cli-core";
import { ensureSameWebinyPackageVersions } from "@webiny/cli-core/utils/ensureSameWebinyPackageVersions.js";
import { prepareDevServerSession } from "@webiny/project-server/serve/devServer/index.js";
import { registerServerFeatures } from "./registerServerFeatures.js";

// Hosting-type marker — lets webiny.config.tsx branch on which CLI is running (e.g. SelfHostedAuth +
// Admin.ApiUrl for server, Cognito for AWS). Read at build/watch time when the config is evaluated.
process.env.WEBINY_HOSTING_TYPE = "server";

// Ensure all @webiny/* packages use the same version.
ensureSameWebinyPackageVersions();

// Reserve the single-port dev proxy's ports and point the apps at each other. Here for the same
// reason WEBINY_HOSTING_TYPE is: `Cli.init` builds the container, which resolves the project SDK to
// pick up <Cli.Command> extensions, which evaluates webiny.config and bakes its env vars. A command
// handler runs long after that, far too late to influence <Admin.ApiUrl> or <Infra.ApiUrl>. Reads
// argv directly, since nothing has parsed it yet, and does nothing for commands that don't want a
// proxy.
await prepareDevServerSession({ argv: process.argv.slice(2) });

const cli = await Cli.init({}, registerServerFeatures);

await cli.run();
