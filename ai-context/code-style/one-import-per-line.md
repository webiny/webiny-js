# One Named Import Per Line

Only import one named import per line.

<!-- prettier-ignore -->
```ts
// Good
import { foo } from "./module";
import { bar } from "./module";
import { baz } from "./module";
```

<!-- prettier-ignore -->
```ts
// Bad
import { foo, bar, baz } from "./module";
```
