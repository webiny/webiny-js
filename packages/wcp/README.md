# `@webiny/wcp`
[![](https://img.shields.io/npm/dw/@webiny/wcp.svg)](https://www.npmjs.com/package/@webiny/wcp)
[![](https://img.shields.io/npm/v/@webiny/wcp.svg)](https://www.npmjs.com/package/@webiny/wcp)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A set of Webiny Control Panel (WCP)-related utilities.

## Table of Contents

-   [Installation](#installation)
-   [Overview](#overview)
-   [Examples](#examples)
-   [Reference](#reference)
    -   [Functions](#functions)
        -   [`getWcpAppUrl`](#getWcpAppUrl)
        -   [`getWcpApiUrl`](#getWcpApiUrl)
        -   [`getWcpGqlApiUrl`](#getWcpGqlApiUrl)

## Installation

```
npm install --save @webiny/wcp
```

Or if you prefer yarn:

```
yarn add @webiny/wcp
```


## Overview

The `@webiny/wcp` package contains essential Webiny Control Panel (WCP)-related utilities. 



## Examples

| Example | Description |
| ------- | ----------- |
| [Retrieve WCP URLs](./docs/examples/retrievingWcpUrls.md) | Shows how to retrieve WCP API and app URLs. |

## Reference

### Functions

#### `getWcpAppUrl`

<details>
<summary>Type Declaration</summary>
<p>

```ts
export declare const getWcpAppUrl: (path?: string | undefined) => string;
```

</p>
</details>  

Returns WCP app URL. The default URL can be overridden via the `WCP_APP_URL` environment variable.


```ts
import { getWcpAppUrl } from "@webiny/wcp";

console.log(getWcpAppUrl()); // Returns "https://d3mudimnmgk2a9.cloudfront.net".
```


#### `getWcpApiUrl`

<details>
<summary>Type Declaration</summary>
<p>

```ts
export declare const getWcpApiUrl: (path?: string | undefined) => string;
```

</p>
</details>  

Returns WCP API URL. The default URL can be overridden via the `WCP_API_URL` environment variable.


```ts
import { getWcpApiUrl } from "@webiny/wcp";

console.log(getWcpApiUrl()); // Returns "https://d3mudimnmgk2a9.cloudfront.net".
```

#### `getWcpGqlApiUrl`

<details>
<summary>Type Declaration</summary>
<p>

```ts
export declare const getWcpGqlApiUrl: (path?: string | undefined) => string;
```

</p>
</details>  

Returns WCP GraphQL API URL.


```ts
import { getWcpGqlApiUrl } from "@webiny/wcp";

console.log(getWcpGqlApiUrl()); // Returns "https://d3mudimnmgk2a9.cloudfront.net/graphql".
```

