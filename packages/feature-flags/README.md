# `@webiny/feature-flags`
[![](https://img.shields.io/npm/dw/@webiny/feature-flags.svg)](https://www.npmjs.com/package/@webiny/feature-flags)
[![](https://img.shields.io/npm/v/@webiny/feature-flags.svg)](https://www.npmjs.com/package/@webiny/feature-flags)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A small library that provides a simple way to define and read feature flags in a Webiny project.

## Table of Contents

-   [Installation](#installation)
-   [Overview](#overview)
-   [Examples](#examples)
-   [Reference](#reference)
    -   [Functions](#functions)
        -   [`getFeature-flagsAppUrl`](#getFeature-flagsAppUrl)
        -   [`getFeature-flagsApiUrl`](#getFeature-flagsApiUrl)
        -   [`getFeature-flagsGqlApiUrl`](#getFeature-flagsGqlApiUrl)

## Installation

```
npm install --save @webiny/feature-flags
```

Or if you prefer yarn:

```
yarn add @webiny/feature-flags
```


## Overview

The `@webiny/feature-flags` exports a single `featureFlags` object which contains all of the feature flags initially set via the Webiny project's `webiny.project.ts` config file, via its `featureFlags` property.

For example, given the following `webiny.project.ts` config file;

```ts
// webiny.project.ts
export default {
    name: "webiny-js",
    cli: {
        ...
    },
    featureFlags: {
        myCustomFeatureFlag: false,
        someFeature: { enabled: true, myCustomProperty: 123, thisIsJson: "yes"}
    }
};
```

Within both backend and frontend application code, the `featureFlags` object can be read like the following:

```ts
import { featureFlags } from "@webiny/feature-flags"; 

const useMyCustomFeature = featureFlags.myCustomFeatureFlag;

const someOtherFeatureMyCustomProperty = featureFlags.someFeature.myCustomProperty;
```

> NOTE
> Behind the scenes, it's the [Webiny CLI](https://www.webiny.com/docs/core-development-concepts/basics/webiny-cli) is that enables the propagation of the values defined via the `featureFlags` parameter to the application both. As mentioned, the values are propagated to both backend and frontend application code. 

## Examples

No additional examples.

## Reference

### Objects

#### `featureFlags`

<details>
<summary>Type Declaration</summary>
<p>

```ts
declare let featureFlags: Record<string, any>;
```

</p>
</details>  

The `featureFlags` object contains all of the feature flags initially set via the Webiny project's `webiny.project.ts` config file, via its `featureFlags` property.


```ts
import { featureFlags } from "@webiny/feature-flags";

const useMyCustomFeature = featureFlags.myCustomFeatureFlag;

const someOtherFeatureMyCustomProperty = featureFlags.someFeature.myCustomProperty;
```
