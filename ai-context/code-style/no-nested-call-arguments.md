# No Nested Call Arguments

Don't nest function calls as arguments to other calls. Each transformation step gets its own named
`const`, even when that costs a few more lines — the name says what the value IS, and a debugger can
show it. Prefer more lines of code over a dense one-liner.

Applies to any call chained through another call's argument list, including setter calls.

```ts
// Bad
this.rawTenantId.set(extractTenantId(headersFromFunctionUrlEvent(ctx.event)));
```

```ts
// Good
const headers = headersFromFunctionUrlEvent(ctx.event);
const tenantId = extractTenantId(headers);

this.rawTenantId.set(tenantId);
```

Method chaining on a fluent API (`builder.a().b().c()`) is not affected — this is about passing the
result of one call straight into another call's parameters.
