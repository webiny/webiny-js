# `@webiny/app-page-builder-elements`

[![](https://img.shields.io/npm/dw/@webiny/app-page-builder-elements.svg)](https://www.npmjs.com/package/@webiny/app-page-builder-elements)
[![](https://img.shields.io/npm/v/@webiny/app-page-builder-elements.svg)](https://www.npmjs.com/package/@webiny/app-page-builder-elements)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A small package that provides all the tools necessary to render pages created with Webiny's Page Builder application.

## Table of Contents

- [Installation](#installation)
- [Overview](#overview)
- [Examples](#examples)
- [Reference](#reference)
    - [Functions](#functions)
        - [`createTheme`](#createTheme)

## Installation

```
npm install --save @webiny/app-page-builder-elements
```

Or if you prefer yarn:

```
yarn add @webiny/app-page-builder-elements
```

> ℹ️ **NOTE**
>
> In most cases, manual installation is not needed as the package is already included in every Webiny project.

## Overview

A small package that provides all the tools necessary to render pages created with Webiny's Page Builder application. It
not only contains a set od default **page element renderers** (or simply **renderers**), like paragraph, heading, block,
cell, or grid, but also the necessary utilities to create new ones.

## Examples

| Example                                        | Description                                                                                                                                                                                                         |
|------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [Manual Setup](./docs/examples/manualSetup.md) | An example of manually setting up the `PageElementsProvider`, with all of the default renderers and modifiers. Useful when rendering pages in an external project, for example in a standalone Next.js application. |

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
import {createTheme} from "@webiny/app-page-builder-elements";

const theme = createTheme({
    breakpoints: {
        desktop: "@media (max-width: 4000px)",
        tablet: "@media (max-width: 991px)",
        "mobile-landscape": "@media (max-width: 767px)",
        "mobile-portrait": "@media (max-width: 478px)"
    },
    styles: {
        colors: {...},
        typography: {...},
        elements: {...}
    }
});
```