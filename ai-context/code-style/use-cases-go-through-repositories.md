# Use Cases Go Through A Repository, Not Storage Operations

A use case depends on a repository. Storage operations are the repository's business, and nobody
else's.

The repository is where a thrown persistence failure becomes a `Result` the caller can act on, where
scoping that every caller would otherwise repeat (tenant, normalized keys) is applied once, and
where write-time housekeeping lives. A use case that injects `SomethingStorageOperations` directly
skips all three, so a database being down leaves the use case as an exception thrown through a
resolver.

```ts
// Bad — the use case reaches into persistence, and a knex failure escapes as an exception.
class ResetPasswordUseCaseImpl implements ResetPasswordUseCase.Interface {
  constructor(private codes: PasswordResetCodeStorageOperations.Interface) {}

  async execute(input: Input) {
    const rows = await this.codes.listLiveCodesByEmail({ email: input.email, now });
    // ...
  }
}
```

```ts
// Good — the repository owns the store, and hands back something the use case can branch on.
class ResetPasswordUseCaseImpl implements ResetPasswordUseCase.Interface {
  constructor(private codes: PasswordResetCodesRepository.Interface) {}

  async execute(input: Input) {
    const live = await this.codes.listLive({ email: input.email, now });
    if (live.isFail()) {
      return Result.fail(live.error);
    }
    // ...
  }
}
```

The persistence failure belongs in the use case's error union, so callers see it in the signature
rather than discovering it at runtime.

Prior art: `ApiKeysRepository` in `api-core`, and every repository under `api-website-builder`,
`api-headless-cms` and `api-aco`.

Absence is not automatically a failure. Return `Result.ok(null)` when "there is no such row" is an
ordinary answer the caller has to branch on (a login that must not reveal whether an account
exists), and fail with a `NotFound` error only when the caller genuinely cannot continue.

This is about use cases, not about the storage packages themselves: a `-sql` or `-ddb` package still
implements `SomethingStorageOperations`, and the repository is the only thing that talks to it.
