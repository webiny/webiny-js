# PRD: Named Dialogs

## Problem

Table row actions that open dialogs create an architectural tension. Each action currently uses the imperative `showDialog()` API, which forces the action handler to mix concerns: loading data, constructing dialog JSX inline, defining submission logic, and handling post-submit navigation. This bypasses the standard Presenter/VM layered architecture, makes dialog logic untestable in isolation, and creates awkward wiring when dialogs need to be driven by headless features.

The existing API also makes it difficult to lazy-load dialog components, since the dialog content must be available at the time `showDialog()` is called.

## Goals

- Drive dialogs through Presenters/VMs using the standard layered architecture.
- Support on-demand mounting: zero rendering cost per table row, dialog mounts only when triggered.
- Support lazy-loading of dialog components.
- Allow features to self-register their dialogs via the existing `AdminConfig` composition pattern.
- Coexist with the current `showDialog()` API for incremental adoption.

## Non-Goals

- Replacing the existing `showDialog()` API. It remains available for simple, inline dialogs.
- Changing the `Dialog` UI component itself.
- Managing dialog stacking or multiple concurrent dialogs (single active dialog is sufficient).

## Design

### Concepts

| Concept                | Role                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Dialog Declaration** | A named registration (`AdminConfig.Dialog`) that associates a name with a React element. The element is stored but not mounted. |
| **Dialog Intent**      | A signal to open a named dialog with params, fired via `useOpenDialog()`.                                                       |
| **Dialog Host**        | Build this within the existing `packages/app-admin/src/components/Dialogs/DialogsContext.tsx` - no need to reinvent anything.   |
| **Dialog Component**   | A self-contained, Presenter-driven component. Mounting _is_ opening. Unmounting _is_ closing.                                   |

### API Surface

#### Registration (feature-side)

AdminConfig API: `packages/app-admin/src/config/AdminConfig.tsx`

```tsx
<AdminConfig.Dialog name="translatePage" element={<TranslatePageDialog />} />
```

- `name` — unique string identifier for the dialog.
- `element` — a React element declared at registration time but **not mounted** until the dialog is opened. The component handles its own lazy loading internally if needed.

#### Shared Schema (feature-level)

```tsx
// Exported from the feature, used by both trigger and dialog.
export const translatePageParams = z.object({
  pageId: z.string(),
  folderId: z.string()
});
```

The Zod schema is the contract between the trigger and the dialog component. Both sides reference the same schema, ensuring type consistency at compile time and runtime validation in development.

#### Trigger (action-side)

```tsx
const TranslatePageAction = () => {
  const { page } = usePage();
  const openDialog = useOpenDialog(translatePageParams);

  return (
    <OptionsMenuItem
      icon={<TranslateIcon />}
      label="Translate"
      onAction={() =>
        openDialog("translatePage", {
          pageId: page.id,
          folderId: page.location.folderId
        })
      }
    />
  );
};
```

- `useOpenDialog(schema?)` returns a typed function to fire a named dialog intent.
- When a schema is provided, params are validated and fully typed at the call site. Passing incorrect params is a compile-time error.
- The schema is optional — `useOpenDialog()` without a schema accepts `Record<string, unknown>` for cases where type safety at the trigger site isn't needed.

#### Params & Control (dialog-side)

```tsx
const TranslatePageDialog = () => {
  // Params (validated + typed) and dialog control from a single hook.
  const { params, closeDialog } = useDialog(translatePageParams);
  const presenter = usePresenter(TranslatePageDialogPresenter);

  useEffect(() => {
    presenter.load(params);
  }, []);

  // ... render from presenter.vm
};
```

- `useDialog(schema)` is the single hook for dialog components. It returns validated, typed params and a dialog controller (`closeDialog`).
- The return type of `params` is inferred from the Zod schema (`z.infer<typeof schema>`).
- On validation failure (mismatched params from the trigger site), the hook throws in development, catching wiring bugs early.
- Repurposes the existing (currently deprecated) `useDialog` hook.

#### Close

```tsx
const { closeDialog } = useDialog(schema);
closeDialog();
```

- Clears the current intent, causing the Host to unmount the dialog component.
- Available from the same `useDialog()` hook that provides params — no separate imports needed.

### Internal State

Add to `packages/app-admin/src/components/Dialogs/DialogsContext.tsx` and upgrade to handle params.

```ts
interface NamedDialogState {
    name: string;
    params: Record<string, unknown>;
} | null
```

Held in the existing dialog manager context/store.

### Lifecycle

1. Feature registers `AdminConfig.Dialog` at app boot (element is stored, not mounted).
2. User clicks a table row action → `openDialog("translatePage", { pageId, folderId })` is called via `useOpenDialog()`.
3. `DialogHost` sees a non-null intent, finds the matching declaration, wraps the registered element in a `DialogParamsContext.Provider` with the params, and mounts it.
4. The dialog component mounts, calls `useDialog(zodSchema)` to access typed params, its Presenter runs `load()`, fetches data, and exposes a VM.
5. The View renders based on the VM. User interacts with the form.
6. On submit: View calls `presenter.submit()`, then `closeDialog()`. On cancel: View calls `closeDialog()` directly.
7. Host unmounts the dialog component. Presenter lifecycle ends naturally.

### Key Conventions

- **Mounting is opening.** Dialog components render with `open={true}` always. The Host controls presence.
- **Context is the integration seam.** The Host provides params via `DialogParamsContext`. Dialog components use `useDialog(zodSchema)` to access validated, typed params and a dialog controller from a single hook. This keeps the registration API simple (`element={<MyDialog />}`) while providing both compile-time type safety and runtime validation from a single source of truth.
- **Lazy loading is internal.** The registered element can itself be a lazy component or wrap its children in `Suspense`. This is an implementation detail of the dialog feature, invisible to the registration and trigger APIs.
- **Presenters don't know about DialogManager.** The Presenter handles domain logic (load, validate, submit, navigate). The View calls `closeDialog()` as a side effect of user actions. This keeps the Presenter free of UI infrastructure concerns.

## Migration Path

1. Ship `useOpenDialog()` hook, repurpose `useDialog(zodSchema)` hook, and add `AdminConfig.Dialog` registration.
2. Migrate dialogs one at a time: extract inline `showDialog` logic into a Presenter + dialog component, register via `AdminConfig.Dialog`, replace action handler with `useOpenDialog()`.
3. No breaking changes. Existing `showDialog()` calls continue to work.
