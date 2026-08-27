# One Class Per File

When generating code, one file MUST only contain one class.

```ts
// Good: Foo.ts
export class Foo {}
```

```ts
// Bad: Foo.ts
export class Foo {}
export class Bar {} // move to Bar.ts
```
