## Changes

This PR introduces multiple changes that improve UX of Webiny and `create-webiny-project` CLIs. In the following
section, we outline all the changes we made.

### `create-webiny-project`

#### x. CWP - Offer Users To Immediately Deploy the Newly Created Project

#### x. WCP Badge In Admin App

#### x. Graceful Error Handling

#### x. Improved Telemetry

- logging finally actual errors

#### x. File That Gets Generated Now Contains Logs

`create-webiny-project-logs.txt`

#### x. Catch `gitignore init`

Causing drops in analytics.

### Webiny CLI

#### x. Pulumi Output Hidden By Default

- `deployment-logs`
- changing progress messages
- error shown if something breaks

#### x. Improved Package Building Output

- webpack bar!
- mulitple packages - Listr!

#### x. No Worker Threads When Building A Single Package

#### x. Refactor - Multiple `BasePackageBuilder` Classes

#### x. Simplified `worker.js` (Worker Thread Code)

#### x. Lazy-import Modules By Calling `require` Inside Functions

#### x. Graceful Error Handling

- packages/cli-plugin-deploy-pulumi/utils/gracefulPulumiErrorHandlers/missingFilesInBuild.js
- packages/cli-plugin-deploy-pulumi/utils/gracefulPulumiErrorHandlers/pendingOperationsInfo.js

#### x. Improved Telemetry

- logging finally actual errors
- new user
- ci

#### x. Removed Pre-5.29-related Code

#### x. CLI Hooks Classes

- PulumiCommandLifecycleEventHookPlugin

#### x. Improved `yarn webiny deploy` output

- calling deploy and info commands directly, not via execa

#### x. Improved `webiny about` Command

- get db setup
- get npm version

#### x. Improved `webiny info` Command Output

- get db setup
- get npm version

#### x. Added `ProjectApplication` Type

#### x. Open Admin App Automatically On First Deploy

#### x. Build Errors Printed Two Times

packages/project-utils/bundling/app/buildApp.js

#### x. Throw Friendly Messages When Deploying API, but not Core / Admin but not API

### Other

#### x. WCP Badge

#### x. Using `wts` Package For Telemetry

#### x. Simplified Telemetry Package Code

#### x. Remove `pbLegacyRenderingEngine` Leftovers

## How Has This Been Tested?

Manual.

## Documentation

Changelog.
