# `@webiny/wcp`
[![](https://img.shields.io/npm/dw/@webiny/wcp.svg)](https://www.npmjs.com/package/@webiny/wcp)
[![](https://img.shields.io/npm/v/@webiny/wcp.svg)](https://www.npmjs.com/package/@webiny/wcp)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

An extended version of the native `Error` class.

## Table of Contents

-   [Installation](#installation)
-   [Overview](#overview)
-   [Examples](#examples)
-   [Reference](#reference)
    -   [Classes](#classes)
        -   [`Error`](#error)

## Installation

```
npm install --save @webiny/wcp
```

Or if you prefer yarn:

```
yarn add @webiny/wcp
```


## Overview

The `@webiny/wcp` package contains essential Webiny Control Panel-related utilities. 



## Examples

| Example | Description |
| ------- | ----------- |
| [Retrieve WCP URLs](./docs/examples/retrievingUrls.md) | Shows how to retrieve WCP API and app URLs. |

## Reference

### Classes

#### `WError`

<details>
<summary>Type Declaration</summary>
<p>

```ts
interface ErrorOptions<TData> {
    message?: string;
    code?: string;
    data?: TData;
}

export default class WError<TData = any> extends Error {
    message: string;
    code?: string;
    data?: TData;
    
    constructor(message: string | ErrorOptions<TData>, code?: string, data?: TData);
    
    static from<TData = any>(err: any, options?: ErrorOptions<TData>): WError<any>;
}
```

</p>
</details>  

The main class that you instantiate and throw, instead of the native one.


```ts
import WError from "@webiny/wcp";

if (new Date().getFullYear() > 2021) {
  throw new Error({
    message: "Year must be greater than 2021.",
    code: "YEAR_NOT_GT_2021",
    data: {
      xyz: 123
    }
  });
}
```

> Note: the `WError` identifier is arbitrary. If preferred, it can pretty much be just `Error` too.
