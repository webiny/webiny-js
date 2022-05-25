# `@webiny/app-wcp`

[![](https://img.shields.io/npm/dw/@webiny/app-wcp.svg)](https://www.npmjs.com/package/@webiny/app-wcp)
[![](https://img.shields.io/npm/v/@webiny/app-wcp.svg)](https://www.npmjs.com/package/@webiny/app-wcp)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A set of frontend Webiny Control Panel (WCP)-related utilities.

## Table of Contents

- [Installation](#installation)
- [Overview](#overview)
- [Examples](#examples)
- [Reference](#reference)
  - [Components](#components)
    - [`Wcp`](#Wcp)
  - [Hooks](#hooks)
      - [`useWcp`](#useWcp)

## Installation

```
npm install --save @webiny/app-wcp
```

Or if you prefer yarn:

```
yarn add @webiny/app-wcp
```

## Overview

The `@webiny/app-wcp` package contains essential Webiny Control Panel (WCP)-related utilities, that can be used within React applications. These include the [`Wcp`](#Wcp) provider component and the [`useWcp`](#useWcp) hook which can be used to get the current WCP project and inspect whether a specific feature is available.

> ℹ️ **INFO**
>
> Internally, the [`Wcp`](#Wcp) provider retrieves WCP project information from the Webiny's default GraphQL API. Because of this, note that this project relies on [`@webiny/api-wcp`](./../api-wcp) when it comes to retrieving project information (via GraphQL).

## Examples

| Example                           | Description                                             |
| --------------------------------- | ------------------------------------------------------- |
| [Setup](./docs/examples/setup.md) | Shows how to set up the [`Wcp`](#Wcp) provider React component. |

## Reference

### Components

#### `Wcp`

<details>
<summary>Type Declaration</summary>
<p>

```ts
export declare const Wcp: React.FC;
```

</p>
</details>

The `Wcp` is a provider component, which retrieves the WCP project information. The component also makes it possible to use the [`useWcp`](#useWcp) hook, which can be used to get the current WCP project information or inspect whether a specific WCP feature is allowed to be used within the React app.

```tsx
import React from "react";
import { Wcp } from "./Wcp";

const App = () => {
  return (
    <Wcp>
      <MyApp />
    </Wcp>
  );
};

export const App;
```

### Hooks

#### `useWcp`

<details>
<summary>Type Declaration</summary>
<p>

```ts
interface UseWcpHook {
    getProject: () => WcpProject | null;
    canUseFeature: (featureId: string) => boolean;
}

export declare function useWcp(): UseWcpHook;
```

</p>
</details>

The `useWcp` hook can be used to get the current WCP project information and inspect whether a specific WCP feature is allowed to be used within the React app.

```ts
import { getWcpAppUrl } from "@webiny/app-wcp";

console.log(getWcpAppUrl()); // Returns "https://d3mudimnmgk2a9.cloudfront.net".
```
