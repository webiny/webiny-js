# `@webiny/api-wcp`

[![](https://img.shields.io/npm/dw/@webiny/api-wcp.svg)](https://www.npmjs.com/package/@webiny/api-wcp)
[![](https://img.shields.io/npm/v/@webiny/api-wcp.svg)](https://www.npmjs.com/package/@webiny/api-wcp)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A set of backend Webiny Control Panel (WCP)-related features.

## Table of Contents

- [Installation](#installation)
- [Overview](#overview)
- [Examples](#examples)
- [Reference](#reference)
  - [Functions](#functions)
    - [`createWcpContext`](#getWcpAppUrl)
    - [`createWcpGraphQL`](#getWcpApiUrl)

## Installation

```
npm install --save @webiny/api-wcp
```

Or if you prefer yarn:

```
yarn add @webiny/api-wcp
```

## Overview

The `@webiny/api-wcp` package contains essential backend Webiny Control Panel (WCP)-related utilities.

## Examples

| Example                                                     | Description                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------- |
| [Registering Plugins](./docs/examples/registeringPlugins.md) | Shows how to register relevant plugins in a [handler function](../handler). |

## Reference

### Functions

#### `createWcpContext`

<details>
<summary>Type Declaration</summary>
<p>

```ts
export declare const createWcpContext: () => ContextPlugin<WcpContext>;
```

</p>
</details>

Creates the WCP context API.

```ts
import { createHandler } from "@webiny/handler-aws";
import { createWcpContext } from "@webiny/api-wcp";

export const handler = createHandler({
  plugins: [
    // Registers WCP context API.  
    createWcpContext(),
    // ...
  ]
});
```

#### `createWcpGraphQL`

<details>
<summary>Type Declaration</summary>
<p>

```ts
export declare const createWcpGraphQL: () => GraphQLSchemaPlugin<WcpContext>;
```

</p>
</details>

Returns WCP API URL. The default URL can be overridden via the `WCP_API_URL` environment variable.

```ts
import { createHandler } from "@webiny/handler-aws";
import { createWcpGraphQL } from "@webiny/api-wcp";

export const handler = createHandler({
    plugins: [
        // Registers WCP context API.  
        createWcpGraphQL(),
        // ...
    ]
});
```
