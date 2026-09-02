# No Stateless Private Methods

A private method that never reads `this` is a plain function wearing a method's clothes. Make it a
module-level function in the same file, unexported.

The class body should then contain only what actually needs instance state — usually the constructor
and the operations the abstraction promises. That is what makes a class worth reading: a reader can
tell at a glance which code depends on the object's state and which is pure input-to-output.

```ts
// Bad — `toError` touches no instance state, so `this.` is noise and the class body is padded.
class ApiStreamClientImpl implements ApiStreamClient.Interface {
  async execute(params: ApiStreamClient.Request): Promise<ApiStreamClient.Response> {
    // ...
    throw await this.toError(response);
  }

  private async toError(response: Response): Promise<ApiStreamRequestError> {
    // ...
  }
}
```

```ts
// Good — pure helpers above the class; the class holds only stateful behavior.
async function toRequestError(response: Response): Promise<ApiStreamRequestError> {
  // ...
}

class ApiStreamClientImpl implements ApiStreamClient.Interface {
  async execute(params: ApiStreamClient.Request): Promise<ApiStreamClient.Response> {
    // ...
    throw await toRequestError(response);
  }
}
```

Keep it a private method when it genuinely reads or mutates instance state, or when it exists to be
overridden by a subclass.

Applies within one file, so it does not conflict with
[one-public-function-per-file.md](./one-public-function-per-file.md): these helpers stay unexported,
which that rule explicitly allows. Move one to its own file only when something else needs it.
