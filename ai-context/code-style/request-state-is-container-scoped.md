# Request State Is Container Scoped

A class that holds data for one request (a DataLoader, a cache of rows, a registry that requests add
to) must be registered with `inContainerScope()` when it's registered in the root container. Never
`inSingletonScope()`.

The root container lives for the whole process (one Lambda instance, one Node server), and every
request gets a child container under it. Storage features register in the root, so the lifetime you
pick there decides how long the state lives:

- `inSingletonScope()` is cached in the container that registers it. Registered in the root, that's
  one instance for the process, shared by every request and every tenant, and built from the root's
  registrations only, so it never sees what extensions register per request.
- `inContainerScope()` is cached in the container that resolves it. Registered once in the root, it
  still builds one instance per request, from that request's container.

```ts
// Bad — a root singleton: the DataLoader's cache outlives the request and serves stale entries.
export const DdbEntryStorageOpsFeature = createFeature({
  name: "cms.ddb.entryStorageOps",
  register: container => {
    container.register(DataLoadersHandler).inSingletonScope();
  }
});
```

```ts
// Good — container scoped. Registered once in the root, built per request.
export const DdbEntryStorageOpsFeature = createFeature({
  name: "cms.ddb.entryStorageOps",
  register: container => {
    // The DataLoader caches reads, so it must live for one request.
    container.register(DataLoadersHandler).inContainerScope();
  }
});
```

The same goes for anything an extension feeds per request: a registry built from
`resolveAll(...)`, or a class that reads a config an extension provides. As a root singleton it is
built before any request exists and never sees those registrations
(`OpenSearchQueryBuilderOperatorRegistry`, `CognitoIdentityProvider`).

## When a root singleton is right

Process-wide state that is the same for every request and tenant belongs in a root singleton,
because building it per request is the waste: the GraphQL schema cache, the JWKS store, the
encryption key cache, and the SQL `TableManager`'s record of which tables it has verified. If you
can't say why the value is identical for every tenant, it's request state.

## Also check

- A plain `register()` (transient) builds a new instance on every resolve, so it holds nothing
  between requests, but it also doesn't share state within one. Request state that several classes
  read needs `inContainerScope()`.
- `registerInstance(A, value)` in the root is one object for the whole process, so it follows this
  rule like a singleton. `registerFactory(A, () => ...)` runs on every resolve, so it's fine as long
  as it builds a new object each call instead of returning one captured outside the factory.
- Before adding the cache at all, see
  [check-the-layer-below-before-caching.md](./check-the-layer-below-before-caching.md).
