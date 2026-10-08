# Use Cases May Share A Repository

A use case may depend on another feature's repository. It does not have to go through that
feature's use case to reach the data.

A repository is the domain layer and a use case is the application layer. The repository's
implementation sitting in another feature's folder is folder organization, not a boundary. We group
a repository with the feature that uses it because a repository rarely needs more than one use case,
not because nothing else may touch it.

What decides it is what the other use case adds on top of the repository. A use case is where
permission checks, events and other side effects live. Go through it when you need those. Call the
repository when you only want to read or write the data.

```ts
// Bad: LogInUseCase sets the signed-in identity, and its decorators retry a failed login, so a
// check that only wants to know "would this login work?" gets side effects it must not have.
class AssumePermissionsUseCaseImpl implements AssumePermissionsUseCase.Interface {
  constructor(private logIn: LogInUseCase.Interface) {}

  private async verify(params: LogInUseCase.Params): Promise<void> {
    await this.logIn.execute(params);
  }
}
```

```ts
// Good: the repository returns the identity and does nothing else, which is all the check needs.
class AssumePermissionsUseCaseImpl implements AssumePermissionsUseCase.Interface {
  constructor(private logInRepository: LogInRepository.Interface) {}

  private async verify(): Promise<void> {
    const identity = await this.logInRepository.login();
    // ...
  }
}
```

Don't write a pass-through use case whose only job is to wrap another feature's repository so the
caller "stays in its layer". It adds a class and changes nothing.

If you skip a use case but still need one rule it applies, don't copy the rule into your use case.
Move it into a plain function both can call, so the two cannot drift apart.

Related: [use-cases-go-through-repositories.md](./use-cases-go-through-repositories.md) for what a
use case may depend on, and
[no-mixed-layers-in-dependencies.md](./no-mixed-layers-in-dependencies.md) for classes that compose
use cases.
