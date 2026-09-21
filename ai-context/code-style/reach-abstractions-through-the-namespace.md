# Reach An Abstraction's Types Through Its Namespace

Every abstraction declares an interface and a namespace that aliases it. Outside the file that
declares them, use the namespace. `Foo.Interface`, never the `IFoo` the namespace points at.

```ts
// Bad — two public names for one type, and the import does not say which abstraction it belongs to.
import type { IAiSdkToolDefinition } from "@webiny/api-core/features/ai/index.js";

export const isReadOnly = (tool: IAiSdkToolDefinition): boolean => /* ... */;
```

```ts
// Good — one name, and it reads as "the interface of this abstraction".
import { AiSdkToolDefinition } from "@webiny/api-core/features/ai/index.js";

export const isReadOnly = (tool: AiSdkToolDefinition.Interface): boolean => /* ... */;
```

The `I`-prefixed interface still has to exist and be exported from the file that declares it:
`createAbstraction<IFoo>("Foo")` needs it, and TypeScript's declaration emit needs it exported for
`Foo.Interface` to reference. That is the whole of its job.

**Do not re-export it from the package.** An `index.ts` exposing both gives callers two names for the
same type, and they will drift: some files import one, some the other, and a reader has to check
whether the two are actually the same thing. `event-handler-core` gets this right — it exports
`HttpRouteDefinition` and `HttpRouteHandler`, and `IHttpRouteDefinition` is visible only inside the
package.

```ts
// Bad — index.ts
export { AiSdkToolDefinition } from "./abstractions.js";
export type { IAiSdkToolDefinition } from "./abstractions.js"; // the same type, twice
```

The namespace is also where the abstraction's other types live, so keeping to it means related names
stay together rather than each acquiring its own `I` export:

```ts
export namespace AiSdkToolDefinition {
  export type Interface<TInput = any> = IAiSdkToolDefinition<TInput>;
  export type Annotations = IAiSdkToolAnnotations;
}
```

This applies to abstraction interfaces. A plain data type with no abstraction behind it (`AiModel`,
`IAiConnection`) has no namespace to live in and is exported directly.
