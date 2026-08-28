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
// Good — presenter: private state, commands, one `vm` getter.
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

export function createReenrichWithAiPresenter(
  gateway: IReenrichFileGateway
): IReenrichWithAiPresenter {
  return new ReenrichWithAiPresenterImpl(gateway);
}
```

```tsx
// Good — component: observer, no state.
export const ReenrichWithAi = observer(function ReenrichWithAi() {
  const presenter = useMemo(() => createReenrichWithAiPresenter(gateway), [gateway]);
  const { vm } = presenter;

  return <Dialog open={vm.open} onOpenChange={open => presenter.setOpen(open)} />;
});
```

## Shape

Mirror the presenters already in the codebase (`SettingsPresenter`, `FileDetailsPresenter`,
`ActionEditPresenter`, `FileManagerPresenter`):

- `interface IXViewModel` — the render-ready values. No domain objects, no callbacks.
- `interface IXPresenter` — the commands plus `get vm(): IXViewModel`.
- `class XPresenterImpl implements IXPresenter` with `makeAutoObservable(this)` in the constructor.
- `export function createXPresenter(deps): IXPresenter` — the component never calls `new`.
- Dependencies arrive through the constructor, not resolved inside; see
  [no-container-as-service-locator.md](./no-container-as-service-locator.md).

## MobX details worth knowing up front

Mutating state after an `await` escapes the action the method started in. Put each mutation in a
named private method — `makeAutoObservable` makes those actions, so calling them after an `await` is
correct and reads better than a chain of assignments.

Keep non-rendered machinery out of the observable map, e.g. an `AbortController`. A private field can
only appear in that map if you name it in the second type parameter:

```ts
makeAutoObservable<XPresenterImpl, "controller">(this, { controller: false });
```
