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
        - [`createCoreApp`](#createCoreApp)
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

### Apps

#### `createCoreApp`

<details>
<summary>Type Declaration</summary>
<p>

```ts
export interface CreateCoreAppConfig {
    /**
     * Secures against deleting database by accident.
     * By default enabled in production environments.
     */
    protect?: PulumiAppInput<boolean>;
    /**
     * Enables ElasticSearch infrastructure.
     * Note that it requires also changes in application code.
     */
    elasticSearch?: PulumiAppInput<boolean>;
    /**
     * Enables VPC for the application.
     * By default enabled in production environments.
     */
    vpc?: PulumiAppInput<boolean>;
    /**
     * Additional settings for backwards compatibility.
     */
    legacy?: PulumiAppInput<CoreAppLegacyConfig>;
    
    pulumi?: (app: ReturnType<typeof createStoragePulumiApp>) => void;
}

export interface CoreAppLegacyConfig {
    useEmailAsUsername?: boolean;
}

export declare function createCoreApp(projectAppConfig?: CreateCoreAppConfig): import("@webiny/pulumi-app").PulumiApp<{
    fileManagerBucket: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/s3").Bucket>;
    eventBus: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/cloudwatch").EventBus>;
    elasticSearch: {
        domain: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/elasticsearch").Domain>;
        domainPolicy: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/elasticsearch").DomainPolicy>;
        table: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/dynamodb").Table>;
        dynamoToElastic: {
            role: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/iam").Role>;
            policy: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/iam").Policy>;
            lambda: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/lambda").Function>;
            eventSourceMapping: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/lambda").EventSourceMapping>;
        };
    } | null;
    userPool: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/cognito").UserPool>;
    userPoolClient: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/cognito").UserPoolClient>;
    dynamoDbTable: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/dynamodb").Table>;
    vpc: {
        vpc: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/ec2").Vpc>;
        subnets: {
            public: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/ec2").Subnet>[];
            private: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/ec2").Subnet>[];
        };
    } | null;
}>;
```

</p>
</details>

Creates Storage Pulumi app.

```ts
// This is imported in our Pulumi program's entrypoint file (index.ts).
import { createStoragePulumiApp } from "@webiny/pulumi-app-aws";

export = async () => {
  const coreApp = createCoreApp();

  return coreApp.runProgram();
};
```

#### `createApiApp`

<details>
<summary>Type Declaration</summary>
<p>

```ts
export interface CreateApiAppConfig {
    /**
     * Enables or disables VPC for the API.
     * For VPC to work you also have to enable it in the Storage application.
     */
    vpc?: PulumiAppInput<boolean>;
    /** Custom domain configuration */
    domain?(app: PulumiApp): CustomDomainParams | undefined | void;
    pulumi?: (app: ReturnType<typeof createApiPulumiApp>) => void;
}

export declare const createApiPulumiApp: (projectAppConfig?: CreateApiAppConfig) => PulumiApp<{
    fileManager: {
        functions: {
            transform: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/lambda").Function>;
            manage: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/lambda").Function>;
            download: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/lambda").Function>;
        };
        bucketNotification: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/s3").BucketNotification>;
    };
    graphql: {
        role: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/iam").Role>;
        policy: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/iam").Policy>;
        functions: {
            graphql: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/lambda").Function>;
        };
    };
    headlessCms: {
        role: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/iam").Role>;
        policy: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/iam").Policy>;
        functions: {
            graphql: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/lambda").Function>;
        };
    };
    apiGateway: {
        api: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/apigatewayv2").Api>;
        stage: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/apigatewayv2").Stage>;
        routes: Record<string, {
            integration: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/apigatewayv2").Integration>;
            route: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/apigatewayv2").Route>;
            permission: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/lambda").Permission>;
        }>;
        addRoute: (name: string, params: import("..").ApiRouteParams) => void;
    };
    cloudfront: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/cloudfront").Distribution>;
    apwScheduler: {
        executeAction: {
            role: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/iam").Role>;
            policy: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/iam").Policy>;
            lambda: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/lambda").Function>;
        };
        scheduleAction: {
            role: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/iam").Role>;
            policy: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/iam").Policy>;
            lambda: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/lambda").Function>;
        };
        eventRule: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/cloudwatch").EventRule>;
        eventTarget: import("@webiny/pulumi-app").PulumiAppResource<typeof import("@pulumi/aws/cloudwatch").EventTarget>;
    };
}>;
```

</p>
</details>

Creates API Pulumi app.

```ts
// This is imported in our Pulumi program's entrypoint file (index.ts).
import { createApiPulumiApp } from "@webiny/pulumi-app-aws";

export = async () => {
  const apiApp = createApiApp();

  return apiApp.runProgram();
};
```

#### `createAdminApp`

<details>
<summary>Type Declaration</summary>
<p>

```ts
import * as aws from "@pulumi/aws";
import { PulumiApp } from "@webiny/pulumi-app";
import { CustomDomainParams } from "../customDomain";

export interface CreateAdminAppConfig {
    /** Custom domain configuration */
    domain?(app: PulumiApp): CustomDomainParams | undefined | void;
    pulumi?: (app: ReturnType<typeof createAdminPulumiApp>) => void;
}

export declare const createAdminPulumiApp: (projectAppConfig: CreateAdminAppConfig) => PulumiApp<{
    cloudfront: import("@webiny/pulumi-app").PulumiAppResource<typeof aws.cloudfront.Distribution>;
    bucket: import("@webiny/pulumi-app").PulumiAppResource<typeof aws.s3.Bucket>;
    origin: aws.types.input.cloudfront.DistributionOrigin;
}>;
```

</p>
</details>

Creates Admin Pulumi app.

```ts
// This is imported in our Pulumi program's entrypoint file (index.ts).
import { createAdminPulumiApp } from "@webiny/pulumi-app-aws";

export = async () => {
  const adminApp = createAdminApp();

  return adminApp.runProgram();
};
```

#### `createWebsiteApp`

<details>
<summary>Type Declaration</summary>
<p>

```ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { PulumiApp } from "@webiny/pulumi-app";
import { CustomDomainParams } from "../customDomain";
import { PulumiAppInput } from "../utils";
export interface CreateWebsiteAppConfig {
    /** Custom domain configuration */
    domain?(app: PulumiApp): CustomDomainParams | undefined | void;
    /**
     * Enables or disables VPC for the API.
     * For VPC to work you also have to enable it in the `storage` application.
     */
    vpc?: PulumiAppInput<boolean | undefined>;
    pulumi?: (app: ReturnType<typeof createWebsitePulumiApp>) => void;
}
export declare const createWebsitePulumiApp: (projectAppConfig?: CreateWebsiteAppConfig) => PulumiApp<{
    prerendering: {
        subscriber: {
            policy: pulumi.Output<aws.iam.Policy>;
            role: import("@webiny/pulumi-app").PulumiAppResource<typeof aws.iam.Role>;
            lambda: import("@webiny/pulumi-app").PulumiAppResource<typeof aws.lambda.Function>;
            eventRule: import("@webiny/pulumi-app").PulumiAppResource<typeof aws.cloudwatch.EventRule>;
            eventPermission: import("@webiny/pulumi-app").PulumiAppResource<typeof aws.lambda.Permission>;
            eventTarget: import("@webiny/pulumi-app").PulumiAppResource<typeof aws.cloudwatch.EventTarget>;
        };
        renderer: {
            policy: pulumi.Output<aws.iam.Policy>;
            role: import("@webiny/pulumi-app").PulumiAppResource<typeof aws.iam.Role>;
            lambda: import("@webiny/pulumi-app").PulumiAppResource<typeof aws.lambda.Function>;
            eventSourceMapping: import("@webiny/pulumi-app").PulumiAppResource<typeof aws.lambda.EventSourceMapping>;
        };
        flush: {
            policy: pulumi.Output<aws.iam.Policy>;
            role: import("@webiny/pulumi-app").PulumiAppResource<typeof aws.iam.Role>;
            lambda: import("@webiny/pulumi-app").PulumiAppResource<typeof aws.lambda.Function>;
            eventRule: import("@webiny/pulumi-app").PulumiAppResource<typeof aws.cloudwatch.EventRule>;
            eventPermission: import("@webiny/pulumi-app").PulumiAppResource<typeof aws.lambda.Permission>;
            eventTarget: import("@webiny/pulumi-app").PulumiAppResource<typeof aws.cloudwatch.EventTarget>;
        };
    };
    app: {
        cloudfront: import("@webiny/pulumi-app").PulumiAppResource<typeof aws.cloudfront.Distribution>;
        bucket: import("@webiny/pulumi-app").PulumiAppResource<typeof aws.s3.Bucket>;
        origin: aws.types.input.cloudfront.DistributionOrigin;
    };
    delivery: {
        cloudfront: import("@webiny/pulumi-app").PulumiAppResource<typeof aws.cloudfront.Distribution>;
        bucket: import("@webiny/pulumi-app").PulumiAppResource<typeof aws.s3.Bucket>;
        origin: aws.types.input.cloudfront.DistributionOrigin;
    };
}>;
```

</p>
</details>

Creates Website Pulumi app.

```ts
// This is imported in our Pulumi program's entrypoint file (index.ts).
import { createWebsitePulumiApp } from "@webiny/pulumi-app-aws";

export = async () => {
  const websiteApp = createWebsiteApp();

  return websiteApp.runProgram();
};
```
