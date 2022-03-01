# Packages for Webiny v6

This folder contains packages that are part of the v6, with the [New Project Setup](https://youtu.be/LyB5xXPZhfo).
All of these packages are currently set to `private` so they are not published to `npm`.

## TOOLS:

@webiny/project - utilities to create project plugins (webiny.config.ts)
@webiny/cli - CLI which will build/watch/deploy a project
@webiny/testing - utilities to use in Jest tests

## PRESETS:

@webiny/preset-aws

Configure storage ops variations:

```ts
import { configurePreset } from "@webiny/preset-aws";
// DDB-only is the default storage
configurePreset({ storage: "ddb-only" });
```

## PLUGINS:

@webiny/base-aws
@webiny/tenancy
@webiny/security
@webiny/i18n
@webiny/file-manager
@webiny/page-builder
@webiny/headless-cms
@webiny/form-builder
@webiny/apw
@webiny/cognito
@webiny/okta
