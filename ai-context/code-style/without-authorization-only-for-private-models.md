# `withoutAuthorization` Only Where Authorization Actually Applies

Don't wrap a private model's fetch in `IdentityContext.withoutAuthorization()`. It changes nothing
and it reads as though something security-sensitive is happening.

`PrivateModelBuilder` sets `authorization: false` on the model
(`packages/api-headless-cms/src/features/modelBuilder/models/PrivateModelBuilder.ts`). `AccessControl`
checks that flag in `modelAuthorizationDisabled()` and short-circuits access to `true` for every
identity, so the wrapper cannot affect the outcome.

```ts
// Bad — the model is private, so this wrapper is a no-op.
const result = await this.identityContext.withoutAuthorization(() => {
  return this.getModel.execute(FILE_MODEL_ID);
});
```

```ts
// Good — private model, fetched directly.
const result = await this.getModel.execute(FILE_MODEL_ID);
```

It IS load-bearing for anything permission-filtered. `ListModelsUseCase` returns a different set per
identity, so dropping the wrapper there makes generated GraphQL schema vary by whoever triggered the
build:

```ts
// Good — ListModels is permission-filtered, so this is required.
const models = await this.identityContext.withoutAuthorization(() => {
  return this.listModels.execute();
});
```

Confirm the model is actually `.private()` before removing a wrapper. Removing one from a
permission-filtered read is the one way this cleanup can silently weaken authorization, so treat
"is this model private?" as a question to answer per call site, not per file.
