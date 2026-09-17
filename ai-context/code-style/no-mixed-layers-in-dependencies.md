# Don't Mix Layers In One Class's Dependencies

If a class composes use cases, every step of its work goes through a use case. Reaching past them to
a repository for one step, because no use case exists for it yet, is a signal to write the missing
use case rather than to drop a layer.

A constructor is the fastest description of what a class does. One that lists four use cases and a
repository reads as though the repository step is different in kind, when usually it is the same
kind of step with a layer missing.

```ts
// Bad — four steps go through use cases, the fifth reaches past them.
class UserInstallerImpl implements AppInstaller.Interface<UserInstallationData> {
  constructor(
    private getRole: GetRoleUseCase.Interface,
    private createUserUseCase: CreateUserUseCase.Interface,
    private setPasswordUseCase: SetPasswordUseCase.Interface,
    private deleteUserUseCase: DeleteUserUseCase.Interface,
    private credentials: CredentialsRepository.Interface
  ) {}
}
```

```ts
// Good — the missing use case is written, and the constructor reads as one layer.
class UserInstallerImpl implements AppInstaller.Interface<UserInstallationData> {
  constructor(
    private getRole: GetRoleUseCase.Interface,
    private createUserUseCase: CreateUserUseCase.Interface,
    private setPasswordUseCase: SetPasswordUseCase.Interface,
    private deleteUserUseCase: DeleteUserUseCase.Interface,
    private deleteCredentialUseCase: DeleteCredentialUseCase.Interface
  ) {}
}
```

The step that gets skipped is rarely trivial. The use case is where authorization lives, where the
`Result` is shaped for callers, and where a decorator can reach it. A caller that goes around it
gets none of that, and nothing says so at the call site.

This is about classes that compose use cases: installers, orchestrators, event handlers, presenters.
It is not a ban on depending on a repository. A repository decorator implements the repository's own
interface, and a shared domain service (caching, permission resolution, settings lookup) sits beside
repositories rather than above use cases. Neither is mixing layers.

Related: [use-cases-go-through-repositories.md](./use-cases-go-through-repositories.md) for the layer
below, and [routes-delegate-to-use-cases.md](./routes-delegate-to-use-cases.md) for transport.
