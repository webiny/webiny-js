### Task 34: Warning presenter, dialog and feature (`app-workflows`)

R205, R212, D157, A71; Review Focus 8 (flag off registers nothing). The UI half of the warning flow: the named dialog the guard (Task 33) opens, its presenter, and the feature that registers the collector, the guard and the presenter. It also settles A71 (what the named-dialog host does when a second dialog opens while the first dialog's `execute` is still running).

- **Texts (R205, D134).** Title "Review in progress". Body for `trash`: "This content has a review in progress. Trashing it cancels the review."; for `delete`: "This content has a review in progress. Deleting it cancels the review.". One line per review: "{title} · Step {stepPosition} of {stepCount} ({stepName})" (middle dot U+00B7; the parenthesis part is left out when `stepName` is empty, the server's fallback for corrupt data). Buttons "Cancel" and "Confirm" (D134: "Cancel stops; Confirm continues"), busy label "Processing..." (the existing `ConfirmationDialog` default). **Copy gate:** the design has no frame for this dialog (`design/files/README.md` and `answers.md` hold none), so the title is not sourced; it and the busy label are the proposed defaults above, isolated in named constants at the top of `buildActiveReviewWarning.ts`. The title constant is **pending user confirmation** (the controller is asking); if it differs, change only that constant and the matching assertions.
- **Presenter** (`ActiveReviewWarningPresenter`, transient, R212): `init({ title, body, reviews })` takes render-ready strings built by the pure `buildActiveReviewWarning` from the dialog params; VM `{ title, body, reviews: { text }[], busy, error }`. `confirm(onConfirm)` sets `busy`, awaits the dialog's `onConfirm` (the guard's `execute`, which never throws), returns `true` when it finished and `false` (with `error` "The server did not respond, so nothing was changed. Try again." and `busy` false, R220) if it threw, so the dialog stays open and Confirm can be retried. **That error branch is defence only**: the guard's `execute` never throws (Task 33), so with the guard it is unreachable; it is kept (and tested) so a different caller whose `onConfirm` throws cannot leave the dialog busy forever. `dismiss()` returns whether dismissing is allowed (not while busy). `dispose()` resets all state.
- **Dialog** (`ActiveReviewWarningDialog`): reads `params` and `onConfirm`/`onCancel`/`closeDialog` from `useNamedConfirmationDialog` (`@webiny/app-admin`), initialises the presenter in an effect (mutating observables during render is not allowed; it renders nothing until the presenter is initialised) and renders the admin-ui `Dialog` with the texts, a danger `Alert` for `vm.error`, and `loading` while busy. Confirm calls `presenter.confirm(onConfirm)` and, when it finished, `closeDialog()`; Cancel (the Cancel action, Esc and the overlay all go through the Dialog's `onOpenChange(false)`, as in Task 15, so no `onClick` is put on `Dialog.CancelAction`: it is a Radix `DialogClose` and would fire twice) calls `presenter.dismiss()` and, when allowed, `onCancel()` then `closeDialog()`. No second confirm exists (R205).
- **A71, read from `packages/app-admin/src/components/Dialogs/DialogsContext.tsx`.** `DialogsProvider` keeps one `namedDialogIntent`; `openNamedDialog(name, params)` is `setNamedDialogIntent({ name, params })`, so a second named dialog **replaces** the first one's element (the first unmounts, its pending `execute` promise keeps running), `closeNamedDialog` is `setNamedDialogIntent(null)` and idempotent, and the first dialog's trailing `closeDialog()` after `await onConfirm()` runs after the warning flow has ended and only clears an already cleared intent. Result: the warning appears in place of the trash dialog, the trash dialog's busy state disappears with it, and no fallback is needed; `ActiveReviewGuard.run`'s contract is unchanged. The host test below pins this against the real `DialogsProvider`, `Confirmation` and `ConfirmationBridge`.
- **Wiring.** The feature registers `ActiveReviewBlockCollector` and `ActiveReviewGuard` as singletons and `ActiveReviewWarningPresenter` transient; its `resolve` returns `{ presenter }` only (the guard is reached by token from the decorators, so the component test needs no `Confirmation`). A small `ActiveReviewWarningConfig` component registers the named dialog; `WorkflowsAdminApp` mounts both inside the flag gate.

**Files:**
- Create: `packages/app-workflows/src/review/trash/buildActiveReviewWarning.ts`
- Create: `packages/app-workflows/src/review/trash/ActiveReviewWarningPresenter.ts` (token, one abstraction per file)
- Create: `packages/app-workflows/src/review/trash/ActiveReviewWarningPresenterImpl.ts`
- Create: `packages/app-workflows/src/review/trash/feature.ts`
- Create: `packages/app-workflows/src/review/trash/components/ActiveReviewWarningDialog.tsx`
- Create: `packages/app-workflows/src/review/trash/components/ActiveReviewWarningConfig.tsx`
- Create: `packages/app-workflows/src/review/trash/buildActiveReviewWarning.test.ts`
- Create: `packages/app-workflows/src/review/trash/ActiveReviewWarningPresenter.test.ts`
- Create: `packages/app-workflows/src/review/trash/components/ActiveReviewWarningDialog.test.tsx`
- Create: `packages/app-workflows/src/review/trash/ActiveReviewTrashFeature.test.tsx`
- Modify: `packages/app-workflows/src/app.tsx`

**Interfaces:**
- Consumes:
  - Task 33: `ACTIVE_REVIEW_WARNING_DIALOG`, `ActiveReviewWarningDialogParams`, `ActiveReviewBlockCollector`, `ActiveReviewGuard` (tokens in `ActiveReviewBlockCollector.ts` and `ActiveReviewGuard.ts`, the dialog params type in `ActiveReviewGuard.ts`, implementations `ActiveReviewBlockCollectorImpl.ts`, `ActiveReviewGuardImpl.ts`).
  - Task 8: `BlockingReview` (`~/review/domain/types.js`).
  - Task 15: only the presenter conventions (a transient presenter through `useFeature`, `createReactiveComponent`, `init` in an effect). Task 15 mounts a plain admin-ui `Dialog` from `ReviewActionDialogHost`, not a named dialog; this task uses the existing named-dialog mechanism (`AdminConfig.Dialog`, `useNamedConfirmationDialog`).
  - Existing: `useNamedConfirmationDialog`, `AdminConfig`, `createReactiveComponent`, `RegisterFeature`, `useFeatureFlags` (`@webiny/app-admin`); `DialogParamsContext` (`@webiny/app-admin/components/Dialogs/DialogParamsContext.js`); `DialogsProvider` (`@webiny/app-admin/components/Dialogs/DialogsContext.js`); `ConfirmationBridge` and `ConfirmationFeature` and `Confirmation` (`@webiny/app-admin/features/confirmation/`); `AdminWithConfig` and `AdminConfigPlugin` (`@webiny/app-admin/config/AdminConfig.js`); `Dialog`, `Alert`, `AdminUiProvider` (`@webiny/admin-ui`); `useFeature`, `DiContainerProvider`, `CompositionProvider` (`@webiny/app`); `createFeature`, `createAbstraction` (`@webiny/feature/admin`); `mobx`.
- Produces (consumed by Tasks 35, 36):
  - `IActiveReviewWarningPresenter`, token `ActiveReviewWarningPresenter` (`Workflows/ActiveReviewWarningPresenter`, in `ActiveReviewWarningPresenter.ts`), implementation `ActiveReviewWarningPresenter` from `ActiveReviewWarningPresenterImpl.ts` (class `ActiveReviewWarningPresenterImpl`), transient.
  - `ActiveReviewTrashFeature` (`createFeature`, name `Workflows/ActiveReviewTrash`, `resolve` -> `{ presenter }`).
  - `ActiveReviewWarningDialog`, `ActiveReviewWarningConfig`.
  - No barrel additions (R-k): deep-path imports only.

- [ ] **Step 1: Write the failing tests**

`packages/app-workflows` runs vitest in jsdom with `@testing-library/react` (Task 8). Admin package: `yarn test <path>` only.

Create `packages/app-workflows/src/review/trash/buildActiveReviewWarning.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { BlockingReview } from "~/review/domain/types.js";
import { buildActiveReviewWarning } from "./buildActiveReviewWarning.js";

function review(overrides: Partial<BlockingReview>): BlockingReview {
    return {
        reviewId: "review-1",
        model: "cms.article",
        targetId: "entry-1",
        targetRevisionId: "entry-1#0001",
        title: "Launch article",
        stepPosition: 2,
        stepCount: 3,
        stepName: "Legal",
        ...overrides
    };
}

describe("buildActiveReviewWarning", () => {
    it("builds the trash texts and one line per review", () => {
        const result = buildActiveReviewWarning({
            action: "trash",
            reviews: [
                review({}),
                review({ reviewId: "review-2", title: "Spring campaign", stepPosition: 1, stepCount: 1, stepName: "Editor" })
            ]
        });

        expect(result.title).toBe("Review in progress");
        expect(result.body).toBe(
            "This content has a review in progress. Trashing it cancels the review."
        );
        expect(result.reviews).toEqual([
            "Launch article · Step 2 of 3 (Legal)",
            "Spring campaign · Step 1 of 1 (Editor)"
        ]);
    });

    it("builds the delete body", () => {
        const result = buildActiveReviewWarning({ action: "delete", reviews: [review({})] });

        expect(result.body).toBe(
            "This content has a review in progress. Deleting it cancels the review."
        );
    });

    it("leaves the parenthesis out when the step has no name", () => {
        const result = buildActiveReviewWarning({
            action: "trash",
            reviews: [review({ stepName: "" })]
        });

        expect(result.reviews).toEqual(["Launch article · Step 2 of 3"]);
    });
});
```

Create `packages/app-workflows/src/review/trash/ActiveReviewWarningPresenter.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { ActiveReviewWarningPresenter as Abstraction } from "./ActiveReviewWarningPresenter.js";
import { ActiveReviewWarningPresenter } from "./ActiveReviewWarningPresenterImpl.js";

const INIT = {
    title: "Review in progress",
    body: "This content has a review in progress. Trashing it cancels the review.",
    reviews: ["Launch article · Step 2 of 3 (Legal)"]
};

const FAILED = "The server did not respond, so nothing was changed. Try again.";

describe("ActiveReviewWarningPresenter", () => {
    let presenter: Abstraction.Interface;

    beforeEach(() => {
        const container = new Container();
        container.register(ActiveReviewWarningPresenter);
        presenter = container.resolve(Abstraction);
    });

    it("starts empty", () => {
        expect(presenter.vm).toEqual({
            title: "",
            body: "",
            reviews: [],
            busy: false,
            error: null
        });
    });

    it("init exposes render-ready texts", () => {
        presenter.init(INIT);

        expect(presenter.vm).toEqual({
            title: "Review in progress",
            body: "This content has a review in progress. Trashing it cancels the review.",
            reviews: [{ text: "Launch article · Step 2 of 3 (Legal)" }],
            busy: false,
            error: null
        });
    });

    it("confirm is busy while the dialog's confirm runs and resolves true when it finishes", async () => {
        presenter.init(INIT);
        let release: () => void = () => undefined;
        const onConfirm = () =>
            new Promise<void>(resolve => {
                release = resolve;
            });

        const pending = presenter.confirm(onConfirm);

        expect(presenter.vm.busy).toBe(true);
        release();
        await expect(pending).resolves.toBe(true);
        expect(presenter.vm.busy).toBe(false);
        expect(presenter.vm.error).toBeNull();
    });

    it("confirm ignores a second call while busy", async () => {
        presenter.init(INIT);
        let calls = 0;
        let release: () => void = () => undefined;
        const onConfirm = () => {
            calls += 1;
            return new Promise<void>(resolve => {
                release = resolve;
            });
        };

        const first = presenter.confirm(onConfirm);
        const second = await presenter.confirm(onConfirm);

        expect(second).toBe(false);
        expect(calls).toBe(1);
        release();
        await first;
    });

    it("confirm shows an error and resolves false when the dialog's confirm throws, and can be retried", async () => {
        presenter.init(INIT);

        const failed = await presenter.confirm(async () => {
            throw new Error("boom");
        });

        expect(failed).toBe(false);
        expect(presenter.vm.busy).toBe(false);
        expect(presenter.vm.error).toBe(FAILED);

        const retried = await presenter.confirm(async () => undefined);

        expect(retried).toBe(true);
        expect(presenter.vm.error).toBeNull();
    });

    it("dismiss is allowed unless busy", async () => {
        presenter.init(INIT);
        expect(presenter.dismiss()).toBe(true);

        let release: () => void = () => undefined;
        const pending = presenter.confirm(
            () =>
                new Promise<void>(resolve => {
                    release = resolve;
                })
        );

        expect(presenter.dismiss()).toBe(false);
        release();
        await pending;
        expect(presenter.dismiss()).toBe(true);
    });

    it("dispose resets all state", async () => {
        presenter.init(INIT);
        await presenter.confirm(async () => {
            throw new Error("boom");
        });

        presenter.dispose();

        expect(presenter.vm).toEqual({
            title: "",
            body: "",
            reviews: [],
            busy: false,
            error: null
        });
    });
});
```

Create `packages/app-workflows/src/review/trash/components/ActiveReviewWarningDialog.test.tsx`:

```tsx
import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app";
import { AdminUiProvider } from "@webiny/admin-ui";
import { DialogParamsContext } from "@webiny/app-admin/components/Dialogs/DialogParamsContext.js";
import type { BlockingReview } from "~/review/domain/types.js";
import { ActiveReviewTrashFeature } from "../feature.js";
import { ActiveReviewWarningDialog } from "./ActiveReviewWarningDialog.js";

// Radix needs these in jsdom.
class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

const reviews: BlockingReview[] = [
    {
        reviewId: "review-1",
        model: "cms.article",
        targetId: "entry-1",
        targetRevisionId: "entry-1#0001",
        title: "Launch article",
        stepPosition: 2,
        stepCount: 3,
        stepName: "Legal"
    },
    {
        reviewId: "review-2",
        model: "cms.article",
        targetId: "entry-2",
        targetRevisionId: "entry-2#0001",
        title: "Spring campaign",
        stepPosition: 1,
        stepCount: 1,
        stepName: "Editor"
    }
];

interface RenderOptions {
    action?: "trash" | "delete";
    onConfirm?: () => Promise<void>;
}

function renderDialog(options: RenderOptions = {}) {
    const container = new Container();
    ActiveReviewTrashFeature.register(container);
    const onConfirm = vi.fn(options.onConfirm ?? (async () => undefined));
    const onCancel = vi.fn();
    const closeDialog = vi.fn();

    render(
        <AdminUiProvider>
            <DiContainerProvider container={container}>
                <DialogParamsContext.Provider
                    value={{
                        params: {
                            reviews,
                            action: options.action ?? "trash",
                            onConfirm,
                            onCancel
                        },
                        closeDialog
                    }}
                >
                    <ActiveReviewWarningDialog />
                </DialogParamsContext.Provider>
            </DiContainerProvider>
        </AdminUiProvider>
    );

    return { onConfirm, onCancel, closeDialog };
}

describe("ActiveReviewWarningDialog", () => {
    afterEach(() => {
        cleanup();
    });

    it("shows the trash texts and one line per review", async () => {
        renderDialog({ action: "trash" });

        expect(await screen.findByText("Review in progress")).toBeTruthy();
        expect(
            screen.getByText("This content has a review in progress. Trashing it cancels the review.")
        ).toBeTruthy();
        expect(screen.getByText("Launch article · Step 2 of 3 (Legal)")).toBeTruthy();
        expect(screen.getByText("Spring campaign · Step 1 of 1 (Editor)")).toBeTruthy();
    });

    it("shows the delete body for the delete action", async () => {
        renderDialog({ action: "delete" });

        expect(
            await screen.findByText(
                "This content has a review in progress. Deleting it cancels the review."
            )
        ).toBeTruthy();
    });

    it("Confirm calls the dialog's confirm once and then closes the dialog", async () => {
        const { onConfirm, onCancel, closeDialog } = renderDialog();

        fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));

        await waitFor(() => expect(closeDialog).toHaveBeenCalledTimes(1));
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
    });

    it("Cancel dismisses and closes without confirming", async () => {
        const { onConfirm, onCancel, closeDialog } = renderDialog();

        fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(closeDialog).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it("shows the busy label and ignores Cancel while confirming", async () => {
        let release: () => void = () => undefined;
        const { onCancel, closeDialog } = renderDialog({
            onConfirm: () =>
                new Promise<void>(resolve => {
                    release = resolve;
                })
        });

        fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));

        expect(await screen.findByText("Processing...")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(onCancel).not.toHaveBeenCalled();

        release();
        await waitFor(() => expect(closeDialog).toHaveBeenCalledTimes(1));
    });

    it("keeps the dialog open with an error when the confirm throws, and Confirm can be retried", async () => {
        const failures = [new Error("boom")];
        const { onConfirm, closeDialog } = renderDialog({
            onConfirm: async () => {
                const failure = failures.shift();
                if (failure) {
                    throw failure;
                }
            }
        });

        fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));

        expect(
            await screen.findByText(
                "The server did not respond, so nothing was changed. Try again."
            )
        ).toBeTruthy();
        expect(closeDialog).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

        await waitFor(() => expect(closeDialog).toHaveBeenCalledTimes(1));
        expect(onConfirm).toHaveBeenCalledTimes(2);
    });
});
```

Create `packages/app-workflows/src/review/trash/ActiveReviewTrashFeature.test.tsx` (feature registration, the gated root, and the A71 host test):

```tsx
import React from "react";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { Container } from "@webiny/di";
import { CompositionProvider } from "@webiny/app";
import { DiContainerProvider } from "@webiny/app";
import { useContainer } from "@webiny/app";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { AdminUiProvider } from "@webiny/admin-ui";
import { AdminConfigPlugin } from "@webiny/app-admin/config/AdminConfig.js";
import { AdminWithConfig } from "@webiny/app-admin/config/AdminConfig.js";
import { DialogsProvider } from "@webiny/app-admin/components/Dialogs/DialogsContext.js";
import { ConfirmationBridge } from "@webiny/app-admin/features/confirmation/index.js";
import { ConfirmationFeature } from "@webiny/app-admin/features/confirmation/feature.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { AdminConfig } from "@webiny/app-admin";
import { useNamedConfirmationDialog } from "@webiny/app-admin";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";
import { ActiveReviewBlockCollector } from "./ActiveReviewBlockCollector.js";
import { ActiveReviewGuard } from "./ActiveReviewGuard.js";
import { ActiveReviewWarningPresenter } from "./ActiveReviewWarningPresenter.js";
import { ActiveReviewTrashFeature } from "./feature.js";
import { ActiveReviewWarningConfig } from "./components/ActiveReviewWarningConfig.js";
import { WorkflowsAdminApp } from "~/app.js";

const flags = vi.hoisted(() => ({ enabled: true }));

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return {
        ...actual,
        useFeatureFlags: () => ({ isEnabled: () => flags.enabled })
    };
});

class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

function findElements(
    node: React.ReactNode,
    predicate: (element: React.ReactElement) => boolean
): React.ReactElement[] {
    const found: React.ReactElement[] = [];
    React.Children.forEach(node, child => {
        if (!React.isValidElement(child)) {
            return;
        }
        if (predicate(child)) {
            found.push(child);
        }
        const props = child.props as { children?: React.ReactNode };
        found.push(...findElements(props.children, predicate));
    });
    return found;
}

describe("ActiveReviewTrashFeature", () => {
    it("registers the collector and the guard as singletons and the presenter as transient", () => {
        const container = new Container();
        container.registerInstance(Confirmation, {
            confirm: vi.fn()
        } as unknown as Confirmation.Interface);
        container.registerInstance(Notifications, {
            notify: vi.fn(),
            success: vi.fn(),
            warning: vi.fn(),
            error: vi.fn(),
            getNotifications: vi.fn(),
            remove: vi.fn()
        });
        ActiveReviewTrashFeature.register(container);

        expect(container.resolve(ActiveReviewGuard)).toBe(container.resolve(ActiveReviewGuard));
        expect(container.resolve(ActiveReviewBlockCollector)).toBe(
            container.resolve(ActiveReviewBlockCollector)
        );
        expect(container.resolve(ActiveReviewWarningPresenter)).not.toBe(
            container.resolve(ActiveReviewWarningPresenter)
        );
    });

    it("the guard and the collector the container hands out share one collector", async () => {
        const confirm = vi.fn();
        const container = new Container();
        container.registerInstance(Confirmation, {
            confirm
        } as unknown as Confirmation.Interface);
        container.registerInstance(Notifications, {
            notify: vi.fn(),
            success: vi.fn(),
            warning: vi.fn(),
            error: vi.fn(),
            getNotifications: vi.fn(),
            remove: vi.fn()
        });
        ActiveReviewTrashFeature.register(container);
        const guard = container.resolve(ActiveReviewGuard);
        const collector = container.resolve(ActiveReviewBlockCollector);
        const runId = collector.begin(["entry-1"]);
        const data: ActiveReviewOnTrashData = {
            model: "cms.article",
            action: "trash",
            reviews: [
                {
                    reviewId: "review-1",
                    model: "cms.article",
                    targetId: "entry-1",
                    targetRevisionId: "entry-1#0001",
                    title: "Launch article",
                    stepPosition: 1,
                    stepCount: 1,
                    stepName: "Editor"
                }
            ]
        };
        const refusal = new GraphQLOperationError({
            message: "Refused.",
            code: ReviewErrorCode.ActiveReviewOnTrash,
            data
        });

        await guard
            .run({
                action: async () => {
                    throw refusal;
                },
                useCases: { cancelForDelete: vi.fn(async () => []) },
                revisionId: null
            })
            .catch(() => undefined);

        collector.end(runId);
        expect(collector.drain(runId)).toHaveLength(1);
        expect(confirm).not.toHaveBeenCalled();
    });
});

describe("WorkflowsAdminApp (composition root)", () => {
    beforeEach(() => {
        flags.enabled = true;
    });

    it("registers the feature and the dialog when the flag is on", () => {
        const tree = WorkflowsAdminApp();

        const features = findElements(tree, element => {
            const props = element.props as { feature?: unknown };
            return props.feature === ActiveReviewTrashFeature;
        });
        const dialogs = findElements(tree, element => element.type === ActiveReviewWarningConfig);
        expect(features).toHaveLength(1);
        expect(dialogs).toHaveLength(1);
    });

    it("registers nothing when the flag is off", () => {
        flags.enabled = false;

        expect(WorkflowsAdminApp()).toBeNull();
    });
});

/**
 * A71: a second named dialog opened while the first dialog's `execute` is still running replaces
 * the first one in the real host. verify: if rendering the real `DialogsProvider` needs another
 * provider than the ones below, add it here and name it in the commit; the assertions are the point.
 */
describe("A71: the named-dialog host", () => {
    const FIRST_DIALOG = "test-first-dialog";

    const FirstDialog = () => {
        const { onConfirm, onCancel, closeDialog } = useNamedConfirmationDialog();

        return (
            <div>
                <span>First dialog</span>
                <button
                    onClick={async () => {
                        await onConfirm();
                        closeDialog();
                    }}
                >
                    First confirm
                </button>
                <button
                    onClick={() => {
                        onCancel();
                        closeDialog();
                    }}
                >
                    First cancel
                </button>
            </div>
        );
    };

    interface RunnerProps {
        run: (container: Container) => Promise<void>;
    }

    const Runner = ({ run }: RunnerProps) => {
        const container = useContainer();
        return <button onClick={() => run(container)}>Trash</button>;
    };

    function createRefusal() {
        const data: ActiveReviewOnTrashData = {
            model: "cms.article",
            action: "trash",
            reviews: [
                {
                    reviewId: "review-1",
                    model: "cms.article",
                    targetId: "entry-1",
                    targetRevisionId: "entry-1#0001",
                    title: "Launch article",
                    stepPosition: 2,
                    stepCount: 3,
                    stepName: "Legal"
                }
            ]
        };
        return new GraphQLOperationError({
            message: "Refused.",
            code: ReviewErrorCode.ActiveReviewOnTrash,
            data
        });
    }

    function renderHost() {
        const container = new Container();
        ConfirmationFeature.register(container);
        container.registerInstance(Notifications, {
            notify: vi.fn(),
            success: vi.fn(),
            warning: vi.fn(),
            error: vi.fn(),
            getNotifications: vi.fn(),
            remove: vi.fn()
        });
        ActiveReviewTrashFeature.register(container);
        const useCases = { cancelForDelete: vi.fn(async () => []) };
        const results: unknown[] = [];
        let blocked = true;
        const action = vi.fn(async () => {
            if (blocked) {
                throw createRefusal();
            }
            return "trashed";
        });
        useCases.cancelForDelete.mockImplementation(async () => {
            blocked = false;
            return [];
        });

        const run = async (resolver: Container) => {
            const confirmation = resolver.resolve(Confirmation);
            const guard = resolver.resolve(ActiveReviewGuard);
            const result = await confirmation.confirm(FIRST_DIALOG, {}, () =>
                guard.run({ action, useCases, revisionId: null })
            );
            results.push(result);
        };

        render(
            <AdminUiProvider>
                <DiContainerProvider container={container}>
                    <CompositionProvider>
                        <AdminWithConfig>
                            <AdminConfig>
                                <AdminConfig.Dialog name={FIRST_DIALOG} element={<FirstDialog />} />
                            </AdminConfig>
                            <ActiveReviewWarningConfig />
                            {AdminConfigPlugin}
                            <DialogsProvider>
                                <ConfirmationBridge />
                                <Runner run={run} />
                            </DialogsProvider>
                        </AdminWithConfig>
                    </CompositionProvider>
                </DiContainerProvider>
            </AdminUiProvider>
        );

        return { useCases, action, results };
    }

    afterEach(() => {
        cleanup();
    });

    it("replaces the first dialog with the warning, then resolves the original confirmation after the repeat", async () => {
        const { useCases, action, results } = renderHost();

        fireEvent.click(screen.getByRole("button", { name: "Trash" }));
        fireEvent.click(await screen.findByRole("button", { name: "First confirm" }));

        expect(await screen.findByText("Review in progress")).toBeTruthy();
        expect(screen.queryByText("First dialog")).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

        await waitFor(() => expect(results).toEqual(["trashed"]));
        expect(useCases.cancelForDelete).toHaveBeenCalledTimes(1);
        expect(action).toHaveBeenCalledTimes(2);
        await waitFor(() => expect(screen.queryByText("Review in progress")).toBeNull());
    });

    it("resolves the original confirmation with false when the warning is dismissed", async () => {
        const { useCases, action, results } = renderHost();

        fireEvent.click(screen.getByRole("button", { name: "Trash" }));
        fireEvent.click(await screen.findByRole("button", { name: "First confirm" }));
        await screen.findByText("Review in progress");

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

        await waitFor(() => expect(results).toEqual([false]));
        expect(useCases.cancelForDelete).not.toHaveBeenCalled();
        expect(action).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(screen.queryByText("Review in progress")).toBeNull());
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/review/trash/buildActiveReviewWarning.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/trash/ActiveReviewWarningPresenter.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/trash/components/ActiveReviewWarningDialog.test.tsx 2>&1 | tail -50
yarn test packages/app-workflows/src/review/trash/ActiveReviewTrashFeature.test.tsx 2>&1 | tail -50
```

Expected: FAIL for all four with `Failed to resolve import` for the new modules (`./buildActiveReviewWarning.js`, `./ActiveReviewWarningPresenter.js`, `../feature.js`, `./components/ActiveReviewWarningConfig.js`). Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/review/trash/ActiveReviewWarningPresenter.ts` (the token and its types):

```ts
import { createAbstraction } from "@webiny/feature/admin";

export interface ActiveReviewWarningLine {
    text: string;
}

export interface ActiveReviewWarningViewModel {
    title: string;
    body: string;
    reviews: ActiveReviewWarningLine[];
    busy: boolean;
    error: string | null;
}

export interface ActiveReviewWarningInitParams {
    title: string;
    body: string;
    reviews: string[];
}

export interface IActiveReviewWarningPresenter {
    readonly vm: ActiveReviewWarningViewModel;
    init(params: ActiveReviewWarningInitParams): void;
    /**
     * Runs the dialog's confirm. Resolves true when it finished, false when it threw (the error
     * is then in the view model) or when a confirm is already running.
     */
    confirm(onConfirm: () => Promise<void>): Promise<boolean>;
    /**
     * True when dismissing is allowed (not while a confirm is running).
     */
    dismiss(): boolean;
    dispose(): void;
}

export const ActiveReviewWarningPresenter = createAbstraction<IActiveReviewWarningPresenter>(
    "Workflows/ActiveReviewWarningPresenter"
);

export namespace ActiveReviewWarningPresenter {
    export type Interface = IActiveReviewWarningPresenter;
    export type ViewModel = ActiveReviewWarningViewModel;
    export type InitParams = ActiveReviewWarningInitParams;
}
```

Create `packages/app-workflows/src/review/trash/buildActiveReviewWarning.ts`:

```ts
import type { BlockingReview } from "~/review/domain/types.js";
import type { ActiveReviewWarningDialogParams } from "./ActiveReviewGuard.js";
import type { ActiveReviewWarningInitParams } from "./ActiveReviewWarningPresenter.js";

// Copy: the title has no design source (pending user confirmation, Task 34 copy gate).
const TITLE = "Review in progress";
const TRASH_BODY = "This content has a review in progress. Trashing it cancels the review.";
const DELETE_BODY = "This content has a review in progress. Deleting it cancels the review.";

function formatReview(review: BlockingReview): string {
    const position = `Step ${review.stepPosition} of ${review.stepCount}`;
    const step = review.stepName ? ` (${review.stepName})` : "";
    return `${review.title} · ${position}${step}`;
}

/**
 * The render-ready texts of the warning dialog (R205, D134): the title, the body for the action
 * and one line per blocking review. Pure.
 */
export const buildActiveReviewWarning = (
    input: ActiveReviewWarningDialogParams
): ActiveReviewWarningInitParams => {
    const body = input.action === "trash" ? TRASH_BODY : DELETE_BODY;
    const reviews = input.reviews.map(formatReview);

    return { title: TITLE, body, reviews };
};
```

Create `packages/app-workflows/src/review/trash/ActiveReviewWarningPresenterImpl.ts`:

```ts
import { makeAutoObservable } from "mobx";
import { ActiveReviewWarningPresenter as Abstraction } from "./ActiveReviewWarningPresenter.js";
import type { ActiveReviewWarningInitParams } from "./ActiveReviewWarningPresenter.js";
import type { ActiveReviewWarningViewModel } from "./ActiveReviewWarningPresenter.js";

const CONFIRM_FAILED = "The server did not respond, so nothing was changed. Try again.";

class ActiveReviewWarningPresenterImpl implements Abstraction.Interface {
    private title = "";
    private body = "";
    private reviews: string[] = [];
    private busy = false;
    private error: string | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    get vm(): ActiveReviewWarningViewModel {
        const reviews = this.reviews.map(text => ({ text }));

        return {
            title: this.title,
            body: this.body,
            reviews,
            busy: this.busy,
            error: this.error
        };
    }

    init(params: ActiveReviewWarningInitParams): void {
        this.title = params.title;
        this.body = params.body;
        this.reviews = params.reviews;
        this.busy = false;
        this.error = null;
    }

    async confirm(onConfirm: () => Promise<void>): Promise<boolean> {
        if (this.busy) {
            return false;
        }

        this.startConfirm();

        try {
            await onConfirm();
            this.finishConfirm();
            return true;
        } catch {
            this.failConfirm();
            return false;
        }
    }

    dismiss(): boolean {
        return !this.busy;
    }

    dispose(): void {
        this.title = "";
        this.body = "";
        this.reviews = [];
        this.busy = false;
        this.error = null;
    }

    private startConfirm(): void {
        this.busy = true;
        this.error = null;
    }

    private finishConfirm(): void {
        this.busy = false;
    }

    private failConfirm(): void {
        this.busy = false;
        this.error = CONFIRM_FAILED;
    }
}

export const ActiveReviewWarningPresenter = Abstraction.createImplementation({
    implementation: ActiveReviewWarningPresenterImpl,
    dependencies: []
});
```

Create `packages/app-workflows/src/review/trash/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ActiveReviewWarningPresenter as PresenterAbstraction } from "./ActiveReviewWarningPresenter.js";
import { ActiveReviewBlockCollector } from "./ActiveReviewBlockCollectorImpl.js";
import { ActiveReviewGuard } from "./ActiveReviewGuardImpl.js";
import { ActiveReviewWarningPresenter } from "./ActiveReviewWarningPresenterImpl.js";

export const ActiveReviewTrashFeature = createFeature({
    name: "Workflows/ActiveReviewTrash",
    register(container) {
        container.register(ActiveReviewBlockCollector).inSingletonScope();
        container.register(ActiveReviewGuard).inSingletonScope();
        // Transient (R212): every dialog gets its own presenter.
        container.register(ActiveReviewWarningPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
```

Create `packages/app-workflows/src/review/trash/components/ActiveReviewWarningDialog.tsx`:

```tsx
import React from "react";
import { useEffect } from "react";
import { Alert } from "@webiny/admin-ui";
import { Dialog } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { useNamedConfirmationDialog } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import type { ActiveReviewWarningDialogParams } from "../ActiveReviewGuard.js";
import { buildActiveReviewWarning } from "../buildActiveReviewWarning.js";
import { ActiveReviewTrashFeature } from "../feature.js";

// Copy: the existing ConfirmationDialog default.
const BUSY_LABEL = "Processing...";

export const ActiveReviewWarningDialog = createReactiveComponent(
    function ActiveReviewWarningDialog() {
        const { params, onConfirm, onCancel, closeDialog } =
            useNamedConfirmationDialog<ActiveReviewWarningDialogParams>();
        const { presenter } = useFeature(ActiveReviewTrashFeature);
        const { reviews, action } = params;

        useEffect(() => {
            const texts = buildActiveReviewWarning({ reviews, action });
            presenter.init(texts);

            return () => {
                presenter.dispose();
            };
        }, [presenter, reviews, action]);

        const { vm } = presenter;

        if (!vm.title) {
            return null;
        }

        const handleConfirm = async () => {
            const finished = await presenter.confirm(onConfirm);
            if (finished) {
                closeDialog();
            }
        };

        const handleCancel = () => {
            if (presenter.dismiss()) {
                onCancel();
                closeDialog();
            }
        };

        const loading = vm.busy ? { text: BUSY_LABEL } : false;

        return (
            <Dialog
                open
                onOpenChange={open => {
                    if (!open) {
                        handleCancel();
                    }
                }}
                title={vm.title}
                loading={loading}
                dismissible={!vm.busy}
                actions={
                    <>
                        <Dialog.CancelAction text={"Cancel"} />
                        <Dialog.ConfirmAction onClick={handleConfirm} text={"Confirm"} />
                    </>
                }
            >
                <p>{vm.body}</p>
                <ul>
                    {vm.reviews.map((line, index) => (
                        <li key={index}>{line.text}</li>
                    ))}
                </ul>
                {vm.error && (
                    <Alert type={"danger"} variant={"subtle"}>
                        {vm.error}
                    </Alert>
                )}
            </Dialog>
        );
    }
);
```

Create `packages/app-workflows/src/review/trash/components/ActiveReviewWarningConfig.tsx`:

```tsx
import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { ACTIVE_REVIEW_WARNING_DIALOG } from "../constants.js";
import { ActiveReviewWarningDialog } from "./ActiveReviewWarningDialog.js";

export const ActiveReviewWarningConfig = () => {
    return (
        <AdminConfig>
            <AdminConfig.Dialog
                name={ACTIVE_REVIEW_WARNING_DIALOG}
                element={<ActiveReviewWarningDialog />}
            />
        </AdminConfig>
    );
};
```

Modify `packages/app-workflows/src/app.tsx` (two hunks; `WorkflowsPermissionsFeature` and its `RegisterFeature` line are kept by Task 37, so they are the anchor):

```tsx
// Before:
import { WorkflowsPermissionsFeature } from "~/features/permissions/feature.js";

// After:
import { WorkflowsPermissionsFeature } from "~/features/permissions/feature.js";
import { ActiveReviewTrashFeature } from "~/review/trash/feature.js";
import { ActiveReviewWarningConfig } from "~/review/trash/components/ActiveReviewWarningConfig.js";
```

```tsx
// Before:
            <RegisterFeature feature={WorkflowsPermissionsFeature} />

// After:
            <RegisterFeature feature={WorkflowsPermissionsFeature} />
            <RegisterFeature feature={ActiveReviewTrashFeature} />
            <ActiveReviewWarningConfig />
```

Both lines sit inside the existing flag gate (`if (!featureFlags.isEnabled("advancedPublishingWorkflow")) { return null; }` comes before the returned fragment), so with the flag off nothing is registered.

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/review/trash/buildActiveReviewWarning.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/trash/ActiveReviewWarningPresenter.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/trash/components/ActiveReviewWarningDialog.test.tsx 2>&1 | tail -50
yarn test packages/app-workflows/src/review/trash/ActiveReviewTrashFeature.test.tsx 2>&1 | tail -50
```

Expected: PASS (4 files). If the A71 host describe fails only because the real `DialogsProvider` needs a provider that the harness lacks, add that provider to the harness and note it in the commit body; do not weaken the two assertions (the warning replaces the first dialog; the original confirmation resolves with the repeat result or `false`). If it fails on behaviour (the first dialog stays, or the original confirmation never resolves), A71's fallback applies: the guard closes the first dialog by resolving its callback with `false`, then opens the warning; record that and stop for the controller, since it changes `ActiveReviewGuard.run`'s internals (not its contract) and Task 33's tests.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

```bash
yarn test packages/app-workflows/src/review/trash/ActiveReviewGuard.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/trash/ActiveReviewBlockCollector.test.ts 2>&1 | tail -50
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: PASS and no type errors.

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
git checkout -- .gitleaks.toml
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "feat(app-workflows): add the active review warning dialog and trash feature" -m "The named dialog lists the blocking reviews under the trash or delete text and confirms through the guard. A71: DialogsProvider keeps one named-dialog intent, so the warning replaces the open trash dialog and no fallback is needed." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start. `yarn adio` may ask for `@webiny/react-composition` only if a source file imports it; the tests import `CompositionProvider` through `@webiny/app`, so no new dependency is expected.

**Contract notes:**
- The contract's `init({ title: string; reviews: string[] })` has no `body`, yet the VM has `body`; `init` takes `{ title, body, reviews }` here (the title is the dialog heading, the body the D134 sentence).
- `ActiveReviewWarningConfig` is an addition (the contract registers the dialog "as a named dialog" without naming the component).
- The feature's `resolve` returns `{ presenter }` only (the contract does not say); the guard is reached by token.
- The dialog title "Review in progress" is confirmed (Q20, R205; a named constant in `buildActiveReviewWarning.ts`); the busy label "Processing..." is the existing `ConfirmationDialog` default; everything else is verbatim from R205 and D134.
- The dialog does not display a failure of the guard's repeated action or of the cancel: the guard rethrows it to the original caller after the dialog has closed (Task 33); the presenter's `error` is defence only (kept, labelled in the Presenter section).
- A71 resolved by reading `DialogsContext.tsx` (replace semantics) and pinned by the host test; if the test shows otherwise, Step 4 says what to do.
