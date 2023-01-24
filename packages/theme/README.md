# `@webiny/theme`
[![](https://img.shields.io/npm/dw/@webiny/theme.svg)](https://www.npmjs.com/package/@webiny/theme)
[![](https://img.shields.io/npm/v/@webiny/theme.svg)](https://www.npmjs.com/package/@webiny/theme)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A small package that provides theme-related utilities for Webiny's Page Builder application.

## Table of Contents

-   [Installation](#installation)
-   [Overview](#overview)
-   [Examples](#examples)
-   [Reference](#reference)
    -   [Functions](#functions)
        -   [`createTheme`](#createTheme)

## Installation

```
npm install --save @webiny/theme
```

Or if you prefer yarn:

```
yarn add @webiny/theme
```

> ℹ️ **NOTE**
> 
> In most cases, manual installation is not needed as the package is already included in every Webiny project. 

## Overview

A small package that provides theme-related utilities for Webiny's Page Builder application. More specifically, it provides the `createTheme` factory function, which is used to construct a theme object. The theme object is used to style the website created with the Page Builder application.

Additionally, the package also provides TypeScript types.

## Examples

| Example                                                     | Description                            |
|-------------------------------------------------------------|----------------------------------------|
| [Creating the Theme Object](./docs/examples/createTheme.md) | An example of creating a theme object. |

## Reference

### Functions

#### `createTheme`

<details>
<summary>Type Declaration</summary>
<p>

```ts
export declare const createTheme: (theme: Theme) => Theme;
```

</p>
</details>

Creates a new theme object.

```ts
import { createTheme } from "@webiny/theme";

const theme = createTheme({
    breakpoints: {
        desktop: "@media (max-width: 4000px)",
        tablet: "@media (max-width: 991px)",
        "mobile-landscape": "@media (max-width: 767px)",
        "mobile-portrait": "@media (max-width: 478px)" 
    },
    styles: {
        colors: { ... },
        typography: { ... },
        elements: { ... }
    }
});
```