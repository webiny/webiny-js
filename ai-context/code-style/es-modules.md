# ES Modules

Use ES modules (`import`/`export`) syntax, not CommonJS (`require`).

```ts
// Good
import { thing } from "./thing";
export const foo = 1;
```

```ts
// Bad
const { thing } = require("./thing");
module.exports = { foo: 1 };
```
