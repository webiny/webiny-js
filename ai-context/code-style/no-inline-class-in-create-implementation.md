# No Inline Class In createImplementation()

Never pass an inline `class` expression to `createImplementation()`. Declare the class separately and pass it by reference. The implementation class must also declare an `implements` clause for the abstraction's interface (e.g. `class Foo implements InputType.Interface { ... }`, or the raw interface such as `IInputType<T>`).

Both are enforced by the `webiny/no-inline-class-in-create-implementation` and `webiny/require-implements-on-create-implementation` oxlint rules.

```ts
// Bad
InputType.createImplementation({
  implementation: class {
    /* ... */
  }
});
```

```ts
// Good
class HttpInputType implements InputType.Interface {
  /* ... */
}
InputType.createImplementation({ implementation: HttpInputType });
```
