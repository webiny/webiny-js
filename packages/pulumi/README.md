# `@webiny/pulumi`

[![](https://img.shields.io/npm/dw/@webiny/pulumi.svg)](https://www.npmjs.com/package/@webiny/pulumi)
[![](https://img.shields.io/npm/v/@webiny/pulumi.svg)](https://www.npmjs.com/package/@webiny/pulumi)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A small framework for creating flexible Pulumi programs.

## Table of Contents

- [Installation](#installation)
- [Overview](#overview)
- [Examples](#examples)
- [Reference](#reference)
    - [Functions](#functions)
        - [`createPulumiApp`](#createPulumiApp)

## Installation

```
npm install --save @webiny/pulumi
```

Or if you prefer yarn:

```
yarn add @webiny/pulumi
```

## Overview

The `@webiny/pulumi` package enables creation of flexible Pulumi apps (programs). 

More specifically, a Pulumi app not only encapsulates the essential Pulumi program code defined by developers, but also, once defined, provides a way to adjust any defined cloud infrastructure resource configuration and even add new resources into the mix.

This is useful when you just want to export a simple constructor function to the user, and not bother them with all the internals. And, as mentioned, in those rare cases when the user actually needs to perform further adjustments, a Pulumi app provides a way to do it.   

> 💡 **TIP**
>
> Pulumi apps are heavily used in real Webiny projects. As mentioned, this is because of their ability to abstract the actual cloud infrastructure code from the user, and, at the same time, provide a way for the user to perform adjustments when needed.

The following example shows how a Pulumi app looks in the actual code:

```ts
// This is imported in our Pulumi program's entrypoint file (index.ts).
import createXyzApp from "@webiny/xyz-app";

export = async () => {
    const xyzApp = createXyzApp({
        pulumi: app => {
            // Let's imagine the `xyz` Pulumi app deploys an Amazon S3 bucket.
            // Then, we would be able to do something like the following:
            app.resources.bucket.config.acl(aws.s3.CannedAcl.Private);
            app.resources.bucket.config.forceDestroy(true);
        }
    });

    return xyzApp.run();
};

```

## Examples

| Example                           | Description                                                     |
| --------------------------------- | --------------------------------------------------------------- |
| [Quick Example](./docs/examples/quickExample.md) | Shows how to create and use a simple Pulumi app. |

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
import { createPulumiApp } from "@webiny/pulumi";

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
