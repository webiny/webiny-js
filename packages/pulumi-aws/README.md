# `@webiny/pulumi-aws`

[![](https://img.shields.io/npm/dw/@webiny/pulumi-aws.svg)](https://www.npmjs.com/package/@webiny/pulumi-aws)
[![](https://img.shields.io/npm/v/@webiny/pulumi-aws.svg)](https://www.npmjs.com/package/@webiny/pulumi-aws)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A set of Pulumi apps that deploy Webiny CMS into Amazon Web Services (AWS).

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
npm install --save @webiny/pulumi-aws
```

Or if you prefer yarn:

```
yarn add @webiny/pulumi-aws
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
export interface CreateCoreAppParams {
    /**
     * Secures against deleting database by accident.
     * By default enabled in production environments.
     */
    protect?: PulumiAppParam<boolean>;
    /**
     * Enables ElasticSearch infrastructure.
     * Note that it requires also changes in application code.
     */
    elasticSearch?: PulumiAppParam<boolean>;
    /**
     * Enables VPC for the application.
     * By default enabled in production environments.
     */
    vpc?: PulumiAppParam<boolean>;
    /**
     * Additional settings for backwards compatibility.
     */
    legacy?: PulumiAppParam<CoreAppLegacyConfig>;
    
    pulumi?: (app: ReturnType<typeof createStoragePulumiApp>) => void;
}

export interface CoreAppLegacyConfig {
    useEmailAsUsername?: boolean;
}

export declare function createCoreApp(projectAppParams?: CreateCoreAppParams): import("@webiny/pulumi").PulumiApp<{
    fileManagerBucket: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/s3").Bucket>;
    eventBus: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/cloudwatch").EventBus>;
    elasticSearch: {
        domain: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/elasticsearch").Domain>;
        domainPolicy: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/elasticsearch").DomainPolicy>;
        table: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/dynamodb").Table>;
        dynamoToElastic: {
            role: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/iam").Role>;
            policy: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/iam").Policy>;
            lambda: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/lambda").Function>;
            eventSourceMapping: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/lambda").EventSourceMapping>;
        };
    } | null;
    userPool: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/cognito").UserPool>;
    userPoolClient: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/cognito").UserPoolClient>;
    dynamoDbTable: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/dynamodb").Table>;
    vpc: {
        vpc: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/ec2").Vpc>;
        subnets: {
            public: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/ec2").Subnet>[];
            private: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/ec2").Subnet>[];
        };
    } | null;
}>;
```

</p>
</details>

Creates Storage Pulumi app.

```ts
// This is imported in our Pulumi program's entrypoint file (index.ts).
import { createStoragePulumiApp } from "@webiny/pulumi-aws";

export = async () => {
  const coreApp = createCoreApp();

  return coreApp.run();
};
```

#### `createApiApp`

<details>
<summary>Type Declaration</summary>
<p>

```ts
export interface CreateApiAppParams {
    /**
     * Enables or disables VPC for the API.
     * For VPC to work you also have to enable it in the Storage application.
     */
    vpc?: PulumiAppParam<boolean>;
    /** Custom domain configuration */
    domain?(app: PulumiApp): CustomDomainParams | undefined | void;
    pulumi?: (app: ReturnType<typeof createApiPulumiApp>) => void;
}

export declare const createApiPulumiApp: (projectAppParams?: CreateApiAppParams) => PulumiApp<{
    fileManager: {
        functions: {
            transform: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/lambda").Function>;
            manage: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/lambda").Function>;
            download: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/lambda").Function>;
        };
        bucketNotification: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/s3").BucketNotification>;
    };
    graphql: {
        role: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/iam").Role>;
        policy: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/iam").Policy>;
        functions: {
            graphql: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/lambda").Function>;
        };
    };
    headlessCms: {
        role: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/iam").Role>;
        policy: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/iam").Policy>;
        functions: {
            graphql: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/lambda").Function>;
        };
    };
    apiGateway: {
        api: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/apigatewayv2").Api>;
        stage: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/apigatewayv2").Stage>;
        routes: Record<string, {
            integration: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/apigatewayv2").Integration>;
            route: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/apigatewayv2").Route>;
            permission: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/lambda").Permission>;
        }>;
        addRoute: (name: string, params: import("..").ApiRouteParams) => void;
    };
    cloudfront: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/cloudfront").Distribution>;
    apwScheduler: {
        executeAction: {
            role: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/iam").Role>;
            policy: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/iam").Policy>;
            lambda: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/lambda").Function>;
        };
        scheduleAction: {
            role: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/iam").Role>;
            policy: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/iam").Policy>;
            lambda: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/lambda").Function>;
        };
        eventRule: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/cloudwatch").EventRule>;
        eventTarget: import("@webiny/pulumi").PulumiAppResource<typeof import("@pulumi/aws/cloudwatch").EventTarget>;
    };
}>;
```

</p>
</details>

Creates API Pulumi app.

```ts
// This is imported in our Pulumi program's entrypoint file (index.ts).
import { createApiPulumiApp } from "@webiny/pulumi-aws";

export = async () => {
  const apiApp = createApiApp();

  return apiApp.run();
};
```

#### `createAdminApp`

<details>
<summary>Type Declaration</summary>
<p>

```ts
import * as aws from "@pulumi/aws";
import { PulumiApp } from "@webiny/pulumi";
import { CustomDomainParams } from "../customDomain";

export interface CreateAdminAppParams {
    /** Custom domain configuration */
    domain?(app: PulumiApp): CustomDomainParams | undefined | void;
    pulumi?: (app: ReturnType<typeof createAdminPulumiApp>) => void;
}

export declare const createAdminPulumiApp: (projectAppParams: CreateAdminAppParams) => PulumiApp<{
    cloudfront: import("@webiny/pulumi").PulumiAppResource<typeof aws.cloudfront.Distribution>;
    bucket: import("@webiny/pulumi").PulumiAppResource<typeof aws.s3.Bucket>;
    origin: aws.types.input.cloudfront.DistributionOrigin;
}>;
```

</p>
</details>

Creates Admin Pulumi app.

```ts
// This is imported in our Pulumi program's entrypoint file (index.ts).
import { createAdminPulumiApp } from "@webiny/pulumi-aws";

export = async () => {
  const adminApp = createAdminApp();

  return adminApp.run();
};
```

#### `createWebsiteApp`

<details>
<summary>Type Declaration</summary>
<p>

```ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { PulumiApp, PulumiAppParam } from "@webiny/pulumi";
import { CustomDomainParams } from "../customDomain";
export interface CreateWebsiteAppParams {
    /** Custom domain configuration */
    domain?(app: PulumiApp): CustomDomainParams | undefined | void;
    /**
     * Enables or disables VPC for the API.
     * For VPC to work you also have to enable it in the `storage` application.
     */
    vpc?: PulumiAppParam<boolean | undefined>;
    pulumi?: (app: ReturnType<typeof createWebsitePulumiApp>) => void;
}
export declare const createWebsitePulumiApp: (projectAppParams?: CreateWebsiteAppParams) => PulumiApp<{
    prerendering: {
        subscriber: {
            policy: pulumi.Output<aws.iam.Policy>;
            role: import("@webiny/pulumi").PulumiAppResource<typeof aws.iam.Role>;
            lambda: import("@webiny/pulumi").PulumiAppResource<typeof aws.lambda.Function>;
            eventRule: import("@webiny/pulumi").PulumiAppResource<typeof aws.cloudwatch.EventRule>;
            eventPermission: import("@webiny/pulumi").PulumiAppResource<typeof aws.lambda.Permission>;
            eventTarget: import("@webiny/pulumi").PulumiAppResource<typeof aws.cloudwatch.EventTarget>;
        };
        renderer: {
            policy: pulumi.Output<aws.iam.Policy>;
            role: import("@webiny/pulumi").PulumiAppResource<typeof aws.iam.Role>;
            lambda: import("@webiny/pulumi").PulumiAppResource<typeof aws.lambda.Function>;
            eventSourceMapping: import("@webiny/pulumi").PulumiAppResource<typeof aws.lambda.EventSourceMapping>;
        };
        flush: {
            policy: pulumi.Output<aws.iam.Policy>;
            role: import("@webiny/pulumi").PulumiAppResource<typeof aws.iam.Role>;
            lambda: import("@webiny/pulumi").PulumiAppResource<typeof aws.lambda.Function>;
            eventRule: import("@webiny/pulumi").PulumiAppResource<typeof aws.cloudwatch.EventRule>;
            eventPermission: import("@webiny/pulumi").PulumiAppResource<typeof aws.lambda.Permission>;
            eventTarget: import("@webiny/pulumi").PulumiAppResource<typeof aws.cloudwatch.EventTarget>;
        };
    };
    app: {
        cloudfront: import("@webiny/pulumi").PulumiAppResource<typeof aws.cloudfront.Distribution>;
        bucket: import("@webiny/pulumi").PulumiAppResource<typeof aws.s3.Bucket>;
        origin: aws.types.input.cloudfront.DistributionOrigin;
    };
    delivery: {
        cloudfront: import("@webiny/pulumi").PulumiAppResource<typeof aws.cloudfront.Distribution>;
        bucket: import("@webiny/pulumi").PulumiAppResource<typeof aws.s3.Bucket>;
        origin: aws.types.input.cloudfront.DistributionOrigin;
    };
}>;
```

</p>
</details>

Creates Website Pulumi app.

```ts
// This is imported in our Pulumi program's entrypoint file (index.ts).
import { createWebsitePulumiApp } from "@webiny/pulumi-aws";

export = async () => {
  const websiteApp = createWebsiteApp();

  return websiteApp.run();
};
```
