# Prefer A Type Annotation Over An Inline Cast

Never wrap an expression in parentheses just so you can cast it. If the value comes back as `any` or
a wider type, annotate the variable instead — the parens disappear and the intent reads left to
right. If a real cast is genuinely needed, give the expression its own `const` first.

```ts
// Bad
const response = (await handle(req)) as IHttpResponse;
const port = (server.address() as AddressInfo).port;
```

```ts
// Good
const response: IHttpResponse = await handle(req);

const address = server.address() as AddressInfo;
const port = address.port;
```

An annotation is also safer than a cast: assigning `any` to an annotated variable still type-checks,
but if the source type later narrows to something incompatible the compiler tells you, whereas `as`
silently keeps compiling.
