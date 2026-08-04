# No Inline Class In createImplementation()

Never pass an inline `class` expression to `createImplementation()`. Declare the class separately and pass it by reference. The implementation class must also declare an `implements` clause for the abstraction's interface (e.g. `class Foo implements EventType.Interface { ... }`, or the raw interface such as `IEventType<T>`).

Both are enforced by the `webiny/no-inline-class-in-create-implementation` and `webiny/require-implements-on-create-implementation` oxlint rules.

```ts
// Bad
EventType.createImplementation({
    implementation: class {
        /* ... */
    }
});
```

```ts
// Good
class HttpEventType implements EventType.Interface {
    /* ... */
}
EventType.createImplementation({ implementation: HttpEventType });
```
