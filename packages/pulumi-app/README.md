# `@webiny/pulumi-app`

[![](https://img.shields.io/npm/dw/@webiny/pulumi-app.svg)](https://www.npmjs.com/package/@webiny/pulumi-app)
[![](https://img.shields.io/npm/v/@webiny/pulumi-app.svg)](https://www.npmjs.com/package/@webiny/pulumi-app)
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
npm install --save @webiny/pulumi-app
```

Or if you prefer yarn:

```
yarn add @webiny/pulumi-app
```

## Overview

The `@webiny/pulumi-app` package enables creation of flexible Pulumi programs. In other words, Pulumi apps contain the essential Pulumi program code, but also enables the developer to update any cloud infrastructure resource configuration or even add new resources.



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
export declare const Wcp: React.FC;
```

</p>
</details>

Creates a new Pulumi app.

```ts
// Defining the app.
import * as aws from "@pulumi/aws";
import { createPulumiApp } from "@webiny/pulumi-app";

export interface CreateAdminAppConfig {
    pulumi?: (app: ReturnType<typeof createMyApp>) => void;
}

const createMyApp = (projectAppConfig: CreateAdminAppConfig) => {
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
