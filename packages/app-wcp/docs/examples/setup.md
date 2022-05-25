# Setup

The first step in using this package is to render the `Wcp` provider React component.

You do this by wrapping your existing application. This ensures that the [`useWcp`](./../../README.md) hook is ready to be used within child React components.

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

> ℹ️ **INFO**
> This package relies on [`@webiny/api-wcp`](./../api-wcp) when it comes to retrieving project information (via GraphQL).
