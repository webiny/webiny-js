# `@webiny/pulumi-app-aws`

[![](https://img.shields.io/npm/dw/@webiny/pulumi-app-aws.svg)](https://www.npmjs.com/package/@webiny/pulumi-app-aws)
[![](https://img.shields.io/npm/v/@webiny/pulumi-app-aws.svg)](https://www.npmjs.com/package/@webiny/pulumi-app-aws)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A small framework for creating flexible Pulumi programs.

## Table of Contents

- [Installation](#installation)
- [Overview](#overview)
- [Examples](#examples)
- [Reference](#reference)
    - [Apps](#functions)
        - [`createStorageApp`](#createStorageApp)
        - [`createApiApp`](#createApiApp)
        - [`createAdminApp`](#createAdminApp)
        - [`createWebsiteApp`](#createWebsiteApp)

## Installation

```
npm install --save @webiny/pulumi-app-aws
```

Or if you prefer yarn:

```
yarn add @webiny/pulumi-app-aws
```

## Overview

A set of Pulumi apps that deploy Webiny CMS into Amazon Web Services (AWS). 

> 💡 **TIP**
>
> Pulumi apps included in this package are automatically included in every Webiny project that's configured to be deployed into Amazon Web Services (AWS).

## Examples

| Example                           | Description                                                     |
| --------------------------------- | --------------------------------------------------------------- |
| [Initialization and Running the Apps](./docs/examples/initializationAndRunningTheApps.md) | Shows how the included apps are initialized and run. |

## Reference

### Functions

#### `createPulumiApp`

<details>
<summary>Type Declaration</summary>
<p>

```ts
export interface CreatePulumiAppParams<TResources extends Record<string, unknown>> {
    name: string;
    path: string;
    config?: Record<string, any>;
    program(app: PulumiApp): TResources | Promise<TResources>;
}

export declare function createPulumiApp<TResources extends Record<string, unknown>>(params: CreatePulumiAppParams<TResources>): PulumiApp<TResources>;
```

</p>
</details>

Creates a new Pulumi app.

```ts
// Defining the app.
import * as aws from "@pulumi/aws";
import { createPulumiApp } from "@webiny/pulumi-app-aws";

export interface CreateMyAppParams {
    pulumi?: (app: ReturnType<typeof createMyApp>) => void;
}

const createMyApp = (projectAppConfig: CreateMyAppParams) => {
    const app = createPulumiApp({
        name: "my-app",
        path: "relative/path/from/cwd",
        program: async app => {
            const bucket = app.addResource(aws.s3.Bucket, {
                name: "my-app",
                config: {
                    acl: aws.s3.CannedAcl.PublicRead,
                    forceDestroy: false,
                    website: {
                        indexDocument: "index.html",
                        errorDocument: "index.html"
                    }
                }
            });

            app.addOutputs({
                appStorage: bucket.output.id
            });

            return {
                bucket
            };
        }
    });

    if (projectAppConfig.pulumi) {
        projectAppConfig.pulumi(app);
    }

    return app;
};
```
