# Presenters Own Component State

A React component that needs more than trivial local state gets a presenter. The component becomes
an `observer` that reads a `vm` and calls commands; it holds no state of its own.

One `useState` for something purely visual (a hover flag, an uncontrolled input) is fine. Several
pieces of state that change together, anything a non-trivial `useEffect` coordinates, or anything a
network call drives — that is a presenter.

```tsx
// Bad — five useState calls, a ref, and branching over the response all inside the component.
export const ReenrichWithAi = () => {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [tags, setTags] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async () => {
    setOpen(true);
    setStatus("running");
    for await (const event of gateway.execute(id)) {
      if (event.type === "partial") {
        setTags(event.tags);
      } // ...
    }
  }, [id]);
  // ...
};
```

```ts
// Good — presenter: private state, commands, one `vm` getter. Registered as an implementation of
// the abstraction, so DI supplies its dependencies.
class ReenrichWithAiPresenterImpl implements IReenrichWithAiPresenter {
  private open = false;
  private status: Status = "idle";

  constructor(private gateway: IReenrichFileGateway) {
    makeAutoObservable(this);
  }

  get vm(): IReenrichWithAiViewModel {
    return { open: this.open, message: STATUS_LABEL[this.status] };
  }

  async start(fileId: string) {
    /* ... */
  }
}

export const ReenrichWithAiPresenter = PresenterAbstraction.createImplementation({
  implementation: ReenrichWithAiPresenterImpl,
  dependencies: [ReenrichFileGateway]
});
```

```ts
// Good — feature.ts: register the presenter, hand it out from `resolve`.
export const AiEnrichmentFeature = createFeature({
  name: "FileManager/AiEnrichment",
  register(container) {
    // Singleton so the state survives re-renders of the view that reads it.
    container.register(ReenrichWithAiPresenter).inSingletonScope();
  },
  resolve(container) {
    return { presenter: container.resolve(PresenterAbstraction) };
  }
});
```

```tsx
// Good — component: reactive, no state, presenter via useFeature.
export const ReenrichWithAi = createReactiveComponent(function ReenrichWithAi() {
  const { presenter } = useFeature(AiEnrichmentFeature);
  const { vm } = presenter;

  return <Dialog open={vm.open} onOpenChange={open => presenter.setOpen(open)} />;
});
```

## Shape

Mirror `AiPowerUpsSettings` in `@webiny/ai-powerups`, which has the full shape:

- `abstractions.ts` — `IXViewModel` (render-ready values; no domain objects, no callbacks),
  `IXPresenter` (the commands plus `readonly vm: IXViewModel`), and the `createAbstraction` token.
- `XPresenter.ts` — `class XPresenterImpl implements IXPresenter` with `makeAutoObservable(this)` in
  the constructor, exported through `PresenterAbstraction.createImplementation({ ... })`.
- `feature.ts` — `container.register(XPresenter).inSingletonScope()` in `register`, and
  `{ presenter: container.resolve(PresenterAbstraction) }` from `resolve`.
- Dependencies arrive through `dependencies` and the constructor, never resolved inside; see
  [no-container-as-service-locator.md](./no-container-as-service-locator.md).

## Wiring: `createReactiveComponent` and `useFeature`

- Wrap the component in `createReactiveComponent` from `@webiny/app-admin`, NOT `observer` from
  `mobx-react-lite`. It is the same thing behind our own export, so components don't each import a
  third-party package directly. Older components still import `observer`; don't copy them.
- Get the presenter from `useFeature(SomeFeature)`. Don't hand-roll one with
  `useMemo(() => createXPresenter(...))` — reserve manual instantiation for something genuinely
  one-off that has no feature to hang off.
- A singleton presenter outlives the component, so `dispose()` must RESET state, not only cancel
  work. Otherwise the next mount inherits the last one's view model — e.g. a dialog that springs
  open on its own.

## MobX details worth knowing up front

Mutating state after an `await` escapes the action the method started in. Put each mutation in a
named private method — `makeAutoObservable` makes those actions, so calling them after an `await` is
correct and reads better than a chain of assignments.

Keep non-rendered machinery out of the observable map, e.g. an `AbortController`. A private field can
only appear in that map if you name it in the second type parameter:

```ts
makeAutoObservable<XPresenterImpl, "controller">(this, { controller: false });
```
