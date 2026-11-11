### Task 18: Dialogs

R234, R276 (conflict, deleted, duplicate reload), R278 (delete, blocked delete, delete step), R279 (switching the model); D92, D115, D123, D131; QBZ-9 (superseded by QBZ-94), QBZ-17, QBZ-18, QBZ-19, QBZ-94; design README 3, `research-spec.md` 4.2 and 4.3 (dialog strings); Review Focus 1 (the dialogs that protect a draft: Keep editing is the secondary button and Escape, a dialog never confirms by itself), Review Focus 6 and 7 (blocked delete shows the count, up to five reviews, the closing sentence, only Close). The view renders `vm.dialog` (a `WorkflowEditorDialogVm`, Tasks 9 and 10) with one component per kind: discard changes (switching the model), conflict, deleted, delete workflow, blocked delete, delete step, reload workflow (the duplicate banner's Reload). The dialogs hold no logic: every text, label and flag is in the VM (R234), the primary button calls `presenter.confirmDialog()` and the secondary button, Escape, the overlay and the close button call `presenter.cancelDialog()` (the presenter decides what each means for its kind, for example `Discard changes` of the deleted dialog). The switch-automation confirmation (R274, Task 12; the drawer's own `SwitchAutomationDialog`) and the leave dialog of the router guard (Task 19) are not part of this task.

- **Kinds and copy** (all assembled by the presenters, Tasks 9 and 10; the tests below use them as literals, so a drifting presenter fails there too):
  - `discardChanges` (R279): title `Discard unsaved changes?`, body `You have unsaved changes to “{name}”. If you leave this workflow now, they are lost.` (`this workflow` when unnamed), `Keep editing` / `Discard changes`.
  - `conflict` (R276, D131): title `Someone else changed this workflow`, body `{name} saved a newer version of “{workflow}” while you were editing, so your changes were not saved. Reload to get the latest version. Reloading discards your unsaved changes.` (name from `savedBy.displayName`, else `Someone`), `Keep editing` / `Reload workflow`.
  - `deleted` (R276, QBZ-94): title `This workflow was deleted`, body `“{workflow}” was deleted while you were editing, so your changes were not saved. Save them as a new workflow for {model}, or discard them.`, `Discard changes` / `Save as new workflow`. Not dismissible: no close button, Escape and the overlay do nothing, because both buttons decide what happens to the draft.
  - `deleteWorkflow` (R278): title `Delete workflow?`, body `“{name}” will be removed from {Model}. New revisions can then be published without a review. Finished reviews keep their history.`, `Cancel` / `Delete workflow`.
  - `blockedDelete` (R278, QBZ-19): title `This workflow can't be deleted yet`, body `1 review using “{name}” is in progress.` or `{n} reviews using “{name}” are in progress.`, the blocking reviews (at most five, each `{title}` and `Step {n} of {N} · {step}`, a link that opens the content in a new tab), then `note`: ` Wait for them to finish, or open each one and cancel it. Then try again.` (viewer with `reassign`) or ` Wait for them to finish, or ask someone with Reassign and operate to cancel them. Then try again.`, and only `Close` (no confirm button).
  - `deleteStep` (R278): title `Delete step?`, body `“{title or Untitled step}” is removed from this workflow when you save. Reviews already running are not affected.`, `Cancel` / `Delete step`.
  - `reloadWorkflow` (R276, QBZ-18): title `Reload workflow?`, body `Your unsaved draft for {model} is lost, and the existing workflow “{name}” opens.`, `Keep editing` / `Reload`.
- **Behaviour of the shell:** the body is a paragraph, then the review list (when there are reviews), then the `note` (when set). While `busy` both buttons are disabled, the dialog shows its loading overlay and Escape does nothing; a dismissible dialog calls `onCancel` on Escape, overlay click and the close button; a dialog whose `confirmLabel` is `null` shows the cancel button only.
- **Destructive buttons (Q47):** `@webiny/admin-ui`'s `Button` had no destructive variant and `Dialog.ConfirmAction` forces `primary`, so this task starts with its own commit (Part A) that adds `variant="destructive"` to `buttonVariants`. The dialogs then render the confirm as `<Button variant="destructive">` when `destructive` (the design's Discard changes, Reload, Delete workflow, Delete step) and `<Button variant="primary">` otherwise; `cancelDestructive` styles the secondary button's text red (the deleted dialog's `Discard changes`).

**Files:**
- Modify (Part A): `packages/admin-ui/src/Button/Button.tsx`
- Create (Part A): `packages/admin-ui/src/Button/Button.test.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/dialogs/EditorConfirmDialog.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/dialogs/DiscardChangesDialog.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/dialogs/ConflictDialog.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/dialogs/DeletedDialog.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/dialogs/DeleteWorkflowDialog.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/dialogs/BlockedDeleteDialog.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/dialogs/DeleteStepDialog.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/dialogs/ReloadWorkflowDialog.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/dialogs/WorkflowEditorDialogs.tsx`
- Modify: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.tsx`
- Create: `packages/app-workflows/src/editor/testing/createDialogVm.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/dialogs/WorkflowEditorDialogs.test.tsx`
- Modify: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutFlow.test.tsx`

**Interfaces:**
- Consumes: Tasks 16 and 17 (`WorkflowEditorLayout`, the layout flow test file, `createEditorViewModel`, `createFakeEditorViewPresenter`), Tasks 9 and 10 (`WorkflowEditorDialogVm { kind, title, body, note, reviews, confirmLabel, cancelLabel, destructive, cancelDestructive, busy }`, `WorkflowEditorDialogKind` (`discardChanges`, `deleteStep`, `conflict`, `deleted`, `deleteWorkflow`, `blockedDelete`, `reloadWorkflow`) and `DialogReviewVm { reviewId, title, position, url }` in `[AWE]/presentation/editor/abstractions.ts`; `vm.dialog`; `confirmDialog()` and `cancelDialog()`; the review `url` of the blocked dialog is built by Task 10 from `IReviewContentAdapter.getContentUrl` with `ReviewContentRef { namespace: review.model, targetId, targetRevisionId, contentTypeId: null }`, R278; the cap of five is Task 10's). Existing (verified): admin-ui `Button` (`buttonVariants`, `variant`), `Dialog` (props `open`, `onOpenChange`, `title`, `dismissible`, `showCloseButton`, `loading`, `actions`; `dismissible={false}` prevents Escape and outside interaction), `Text`, `cn`.
- Produces: `EditorConfirmDialog` and `EditorDialogProps`, the seven kind components, `WorkflowEditorDialogs`, `createDialogVm`.

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`. The Radix dialog renders into `document.body`; query it through `screen`.

## Part A: the destructive Button variant (its own commit, Q47)

Create `packages/admin-ui/src/Button/Button.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { buttonVariants } from "./Button.js";

describe("buttonVariants destructive", () => {
    it("uses the destructive colours for the normal, hover, active and disabled states", () => {
        const className = buttonVariants({ variant: "destructive" });

        expect(className).toContain("bg-destructive");
        expect(className).toContain("hover:bg-destructive-strong");
        expect(className).toContain("active:bg-destructive-xstrong");
        expect(className).toContain("aria-disabled:bg-destructive-disabled");
    });

    it("keeps the primary variant free of destructive colours", () => {
        expect(buttonVariants({ variant: "primary" })).not.toContain("bg-destructive");
    });
});
```

Run `yarn test packages/admin-ui/src/Button/Button.test.ts 2>&1 | tail -30`; expected RED: the destructive classes are missing (`variant: "destructive"` is not a variant, cva ignores it). Then modify `packages/admin-ui/src/Button/Button.tsx`: in `buttonVariants`, after the `primary: [...]` array (before `secondary: [`), add

```ts
                destructive: [
                    "bg-destructive text-neutral-light fill-neutral-base",
                    "hover:bg-destructive-strong",
                    "active:bg-destructive-xstrong",
                    "aria-disabled:bg-destructive-disabled"
                ],
```

and in `packages/admin-ui/src/Button/Button.stories.tsx` add `"destructive"` to the `variant` `options` array on line 14. Run the test again (GREEN), `yarn build -p @webiny/admin-ui --no-cache 2>&1 | tail -30`, then the pre-commit chain of Step 6 for `@webiny/admin-ui` and commit `feat(admin-ui): add the destructive Button variant` (body: `The editor's destructive confirmations (Discard changes, Reload, Delete workflow, Delete step) need a red button; Dialog.ConfirmAction forces the primary variant.`, same trailers). The dialogs below start after this commit.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/testing/createDialogVm.ts` (a pure builder, R243; the texts are the presenters' copy, one table):

```ts
import type { WorkflowEditorDialogKind } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowEditorDialogVm } from "~/editor/presentation/editor/abstractions.js";

const DIALOGS: Record<WorkflowEditorDialogKind, WorkflowEditorDialogVm> = {
    discardChanges: {
        kind: "discardChanges",
        title: "Discard unsaved changes?",
        body: "You have unsaved changes to “Article review”. If you leave this workflow now, they are lost.",
        note: null,
        reviews: [],
        confirmLabel: "Discard changes",
        cancelLabel: "Keep editing",
        destructive: true,
        cancelDestructive: false,
        busy: false
    },
    conflict: {
        kind: "conflict",
        title: "Someone else changed this workflow",
        body: "Ivan Horvat saved a newer version of “Article review” while you were editing, so your changes were not saved. Reload to get the latest version. Reloading discards your unsaved changes.",
        note: null,
        reviews: [],
        confirmLabel: "Reload workflow",
        cancelLabel: "Keep editing",
        destructive: false,
        cancelDestructive: false,
        busy: false
    },
    deleted: {
        kind: "deleted",
        title: "This workflow was deleted",
        body: "“Article review” was deleted while you were editing, so your changes were not saved. Save them as a new workflow for Article, or discard them.",
        note: null,
        reviews: [],
        confirmLabel: "Save as new workflow",
        cancelLabel: "Discard changes",
        destructive: false,
        cancelDestructive: true,
        busy: false
    },
    deleteWorkflow: {
        kind: "deleteWorkflow",
        title: "Delete workflow?",
        body: "“Article review” will be removed from Article. New revisions can then be published without a review. Finished reviews keep their history.",
        note: null,
        reviews: [],
        confirmLabel: "Delete workflow",
        cancelLabel: "Cancel",
        destructive: true,
        cancelDestructive: false,
        busy: false
    },
    blockedDelete: {
        kind: "blockedDelete",
        title: "This workflow can't be deleted yet",
        body: "2 reviews using “Article review” are in progress.",
        note: "Wait for them to finish, or ask someone with Reassign and operate to cancel them. Then try again.",
        reviews: [
            {
                reviewId: "review-1",
                title: "Spring campaign",
                position: "Step 2 of 3 · Legal sign-off",
                url: "/cms/content-entries/article?id=entry-1%230001"
            },
            {
                reviewId: "review-2",
                title: "Summer sale",
                position: "Step 1 of 3 · Editorial check",
                url: "/cms/content-entries/article?id=entry-2%230001"
            }
        ],
        confirmLabel: null,
        cancelLabel: "Close",
        destructive: false,
        cancelDestructive: false,
        busy: false
    },
    deleteStep: {
        kind: "deleteStep",
        title: "Delete step?",
        body: "“Legal sign-off” is removed from this workflow when you save. Reviews already running are not affected.",
        note: null,
        reviews: [],
        confirmLabel: "Delete step",
        cancelLabel: "Cancel",
        destructive: true,
        cancelDestructive: false,
        busy: false
    },
    reloadWorkflow: {
        kind: "reloadWorkflow",
        title: "Reload workflow?",
        body: "Your unsaved draft for Article is lost, and the existing workflow “Article approval” opens.",
        note: null,
        reviews: [],
        confirmLabel: "Reload",
        cancelLabel: "Keep editing",
        destructive: true,
        cancelDestructive: false,
        busy: false
    }
};

// The dialog of a kind with the design's copy; `overrides` changes single fields.
export const createDialogVm = (
    kind: WorkflowEditorDialogKind,
    overrides: Partial<WorkflowEditorDialogVm> = {}
): WorkflowEditorDialogVm => {
    return { ...DIALOGS[kind], ...overrides };
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/dialogs/WorkflowEditorDialogs.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { within } from "@testing-library/react";
import type { WorkflowEditorDialogKind } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowEditorDialogVm } from "~/editor/presentation/editor/abstractions.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { createDialogVm } from "~/editor/testing/createDialogVm.js";
import { WorkflowEditorDialogs } from "./WorkflowEditorDialogs.js";

const renderDialog = (dialog: WorkflowEditorDialogVm | null) => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const result = renderWithAdminUi(
        <WorkflowEditorDialogs dialog={dialog} onConfirm={onConfirm} onCancel={onCancel} />
    );
    return { ...result, onConfirm, onCancel };
};

interface KindCase {
    kind: WorkflowEditorDialogKind;
    testId: string;
}

const KINDS: KindCase[] = [
    { kind: "discardChanges", testId: "discard-changes-dialog" },
    { kind: "conflict", testId: "conflict-dialog" },
    { kind: "deleted", testId: "deleted-dialog" },
    { kind: "deleteWorkflow", testId: "delete-workflow-dialog" },
    { kind: "blockedDelete", testId: "blocked-delete-dialog" },
    { kind: "deleteStep", testId: "delete-step-dialog" },
    { kind: "reloadWorkflow", testId: "reload-workflow-dialog" }
];

const wait = () => new Promise(resolve => setTimeout(resolve, 20));

describe("WorkflowEditorDialogs", () => {
    it("renders nothing without a dialog", () => {
        renderDialog(null);

        expect(screen.queryByRole("dialog")).toBeNull();
    });

    for (const { kind, testId } of KINDS) {
        it(`renders the ${kind} dialog with its title and body from the view model`, () => {
            const dialog = createDialogVm(kind);
            renderDialog(dialog);

            expect(screen.getByRole("dialog")).toBeTruthy();
            expect(screen.getByText(dialog.title)).toBeTruthy();
            expect(screen.getByText(dialog.body)).toBeTruthy();
            expect(screen.getByTestId(testId)).toBeTruthy();
        });
    }

    it("shows the discard dialog's buttons and routes them", () => {
        const { onConfirm, onCancel } = renderDialog(createDialogVm("discardChanges"));

        fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("shows the conflict dialog's buttons", () => {
        const { onConfirm, onCancel } = renderDialog(createDialogVm("conflict"));

        fireEvent.click(screen.getByRole("button", { name: "Reload workflow" }));
        expect(onConfirm).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("shows the delete workflow dialog's buttons", () => {
        const { onConfirm, onCancel } = renderDialog(createDialogVm("deleteWorkflow"));

        fireEvent.click(screen.getByRole("button", { name: "Delete workflow" }));
        expect(onConfirm).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("shows the delete step dialog's buttons", () => {
        const { onConfirm, onCancel } = renderDialog(createDialogVm("deleteStep"));

        fireEvent.click(screen.getByRole("button", { name: "Delete step" }));
        expect(onConfirm).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("shows the reload dialog's buttons", () => {
        const { onConfirm, onCancel } = renderDialog(createDialogVm("reloadWorkflow"));

        fireEvent.click(screen.getByRole("button", { name: "Reload" }));
        expect(onConfirm).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("routes the deleted dialog's two decisions: Discard changes cancels, Save as new confirms", () => {
        const { onConfirm, onCancel } = renderDialog(createDialogVm("deleted"));

        fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: "Save as new workflow" }));
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("cannot dismiss the deleted dialog with Escape and has no close button", async () => {
        const { onCancel, onConfirm } = renderDialog(createDialogVm("deleted"));

        fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
        await wait();

        expect(onCancel).not.toHaveBeenCalled();
        expect(onConfirm).not.toHaveBeenCalled();
        expect(screen.getAllByRole("button")).toHaveLength(2);
    });

    it("cancels a dismissible dialog on Escape", async () => {
        const { onCancel, onConfirm } = renderDialog(createDialogVm("discardChanges"));

        fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

        await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it("has a close button on a dismissible dialog that cancels", () => {
        const { onCancel } = renderDialog(createDialogVm("conflict"));

        expect(screen.getAllByRole("button")).toHaveLength(3);
        const close = screen.getAllByRole("button").find(button => {
            return button.textContent === "" && !button.hasAttribute("disabled");
        });
        fireEvent.click(close as HTMLElement);

        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("disables both buttons and ignores Escape while busy", async () => {
        const { onCancel, onConfirm } = renderDialog(
            createDialogVm("deleteWorkflow", { busy: true })
        );

        const confirm = screen.getByRole("button", { name: "Delete workflow" });
        const cancel = screen.getByRole("button", { name: "Cancel" });
        expect(confirm.hasAttribute("disabled")).toBe(true);
        expect(cancel.hasAttribute("disabled")).toBe(true);

        fireEvent.click(confirm);
        fireEvent.click(cancel);
        fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
        await wait();

        expect(onConfirm).not.toHaveBeenCalled();
        expect(onCancel).not.toHaveBeenCalled();
    });

    it("styles the confirm button red for a destructive dialog only", () => {
        const { unmount } = renderDialog(createDialogVm("deleteWorkflow"));
        expect(screen.getByRole("button", { name: "Delete workflow" }).className).toContain(
            "bg-destructive"
        );
        unmount();

        renderDialog(createDialogVm("conflict"));
        expect(screen.getByRole("button", { name: "Reload workflow" }).className).not.toContain(
            "bg-destructive"
        );
    });

    it("styles the secondary button red when the presenter marks it destructive", () => {
        renderDialog(createDialogVm("deleted"));

        expect(screen.getByRole("button", { name: "Discard changes" }).className).toContain(
            "text-destructive-primary"
        );
        expect(screen.getByRole("button", { name: "Save as new workflow" }).className).not.toContain(
            "bg-destructive"
        );
    });

    it("lists the blocking reviews with their position and a link, and offers only Close", () => {
        const { onConfirm, onCancel } = renderDialog(createDialogVm("blockedDelete"));

        const list = screen.getByTestId("blocked-reviews");
        const links = within(list).getAllByRole("link");
        expect(links).toHaveLength(2);
        expect(within(links[0]).getByText("Spring campaign")).toBeTruthy();
        expect(within(links[0]).getByText("Step 2 of 3 · Legal sign-off")).toBeTruthy();
        expect(links[0].getAttribute("href")).toBe("/cms/content-entries/article?id=entry-1%230001");
        expect(links[0].getAttribute("target")).toBe("_blank");
        expect(within(links[1]).getByText("Summer sale")).toBeTruthy();

        expect(screen.queryByRole("button", { name: "Delete workflow" })).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it("shows the closing note below the review list", () => {
        renderDialog(createDialogVm("blockedDelete"));

        const list = screen.getByTestId("blocked-reviews");
        const note = screen.getByText(
            "Wait for them to finish, or ask someone with Reassign and operate to cancel them. Then try again."
        );
        expect(list.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("shows no note when the view model has none", () => {
        renderDialog(createDialogVm("deleteWorkflow"));

        expect(screen.queryByTestId("dialog-note")).toBeNull();
    });

    it("shows five blocking reviews as given", () => {
        const reviews = [1, 2, 3, 4, 5].map(number => {
            return {
                reviewId: `review-${number}`,
                title: `Review ${number}`,
                position: `Step 1 of 2 · Check ${number}`,
                url: `/content/${number}`
            };
        });
        renderDialog(createDialogVm("blockedDelete", { reviews }));

        expect(within(screen.getByTestId("blocked-reviews")).getAllByRole("link")).toHaveLength(5);
    });

    it("shows no review list when the dialog has no reviews", () => {
        renderDialog(createDialogVm("blockedDelete", { reviews: [] }));

        expect(screen.queryByTestId("blocked-reviews")).toBeNull();
    });
});
```

Modify `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutFlow.test.tsx`. Add the import below `import { createFakeSortable } from "~/editor/testing/fakeSortablePresenter.js";`:

```tsx
import { createDialogVm } from "~/editor/testing/createDialogVm.js";
```

and add cases at the end of the `describe("WorkflowEditorLayout flow", ...)` block (before its closing `});`):

```tsx
    it("shows no dialog while the view model has none", () => {
        renderLayout();

        expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("renders the presenter's dialog and sends its decisions to the presenter", () => {
        const presenter = renderLayout({ dialog: createDialogVm("deleteWorkflow") });

        expect(screen.getByText("Delete workflow?")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(presenter.cancelDialog).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", { name: "Delete workflow" }));
        expect(presenter.confirmDialog).toHaveBeenCalledTimes(1);
    });

    it("renders a dialog even when no workflow is open", () => {
        renderLayout({ detail: "none", header: null, dialog: createDialogVm("discardChanges") });

        expect(screen.getByText("Discard unsaved changes?")).toBeTruthy();
    });
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/components/dialogs/WorkflowEditorDialogs.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutFlow.test.tsx 2>&1 | tail -30
```

Expected: `WorkflowEditorDialogs.test.tsx` fails with `Failed to resolve import` for `./WorkflowEditorDialogs.js`. In `WorkflowEditorLayoutFlow.test.tsx` the two dialog cases that expect a dialog fail (`vm.dialog` is not rendered); the old cases still pass. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/editor/components/dialogs/EditorConfirmDialog.tsx`:

```tsx
import React from "react";
import { Button } from "@webiny/admin-ui";
import { Dialog } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import type { WorkflowEditorDialogVm } from "~/editor/presentation/editor/abstractions.js";

export interface EditorDialogProps {
    dialog: WorkflowEditorDialogVm;
    onConfirm(): void;
    onCancel(): void;
}

export interface EditorConfirmDialogProps extends EditorDialogProps {
    testId: string;
    // False for a dialog whose buttons decide the draft: no close button, Escape and overlay do nothing.
    dismissible?: boolean;
    // Content between the body and the note (the blocked dialog's review list).
    children?: React.ReactNode;
}

/*
 * The shell of every editor dialog: title, body, optional content and note from the view model, a
 * secondary button and an optional primary button. The dialog is open while it is mounted; the
 * presenter owns its state. A dismissible dialog cancels on Escape, overlay and the close button;
 * nothing closes while busy.
 */
export const EditorConfirmDialog = (props: EditorConfirmDialogProps) => {
    const { dialog, onConfirm, onCancel, testId, children } = props;
    const dismissible = props.dismissible !== false;

    let confirm: React.ReactNode = null;
    if (dialog.confirmLabel !== null) {
        let confirmVariant: "primary" | "destructive" = "primary";
        if (dialog.destructive) {
            confirmVariant = "destructive";
        }
        confirm = (
            <Button
                variant={confirmVariant}
                text={dialog.confirmLabel}
                disabled={dialog.busy}
                onClick={onConfirm}
            />
        );
    }

    const cancelClass = cn(dialog.cancelDestructive && "text-destructive-primary");
    const actions = (
        <>
            <Button
                variant="secondary"
                text={dialog.cancelLabel}
                className={cancelClass}
                disabled={dialog.busy}
                onClick={onCancel}
            />
            {confirm}
        </>
    );

    let note: React.ReactNode = null;
    if (dialog.note !== null) {
        note = (
            <Text size="md" data-testid="dialog-note">
                {dialog.note}
            </Text>
        );
    }

    return (
        <Dialog
            open={true}
            onOpenChange={open => {
                if (!open && dismissible && !dialog.busy) {
                    onCancel();
                }
            }}
            title={dialog.title}
            dismissible={dismissible}
            showCloseButton={dismissible}
            loading={dialog.busy}
            actions={actions}
        >
            <div data-testid={testId} className="flex flex-col gap-md">
                <Text size="md">{dialog.body}</Text>
                {children}
                {note}
            </div>
        </Dialog>
    );
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/dialogs/DiscardChangesDialog.tsx`:

```tsx
import React from "react";
import { EditorConfirmDialog } from "./EditorConfirmDialog.js";
import type { EditorDialogProps } from "./EditorConfirmDialog.js";

// Switching the model with a dirty draft (R279): Keep editing / Discard changes.
export const DiscardChangesDialog = (props: EditorDialogProps) => {
    return <EditorConfirmDialog {...props} testId="discard-changes-dialog" />;
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/dialogs/ConflictDialog.tsx`:

```tsx
import React from "react";
import { EditorConfirmDialog } from "./EditorConfirmDialog.js";
import type { EditorDialogProps } from "./EditorConfirmDialog.js";

// Another admin saved a newer version (R276, D131): Keep editing / Reload workflow.
export const ConflictDialog = (props: EditorDialogProps) => {
    return <EditorConfirmDialog {...props} testId="conflict-dialog" />;
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/dialogs/DeletedDialog.tsx`:

```tsx
import React from "react";
import { EditorConfirmDialog } from "./EditorConfirmDialog.js";
import type { EditorDialogProps } from "./EditorConfirmDialog.js";

// The workflow was deleted while editing (R276, QBZ-94): Discard changes / Save as new workflow. Not dismissible.
export const DeletedDialog = (props: EditorDialogProps) => {
    return <EditorConfirmDialog {...props} testId="deleted-dialog" dismissible={false} />;
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/dialogs/DeleteWorkflowDialog.tsx`:

```tsx
import React from "react";
import { EditorConfirmDialog } from "./EditorConfirmDialog.js";
import type { EditorDialogProps } from "./EditorConfirmDialog.js";

// Confirm deleting the open workflow (R278): Cancel / Delete workflow.
export const DeleteWorkflowDialog = (props: EditorDialogProps) => {
    return <EditorConfirmDialog {...props} testId="delete-workflow-dialog" />;
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/dialogs/BlockedDeleteDialog.tsx`:

```tsx
import React from "react";
import { Text } from "@webiny/admin-ui";
import { EditorConfirmDialog } from "./EditorConfirmDialog.js";
import type { EditorDialogProps } from "./EditorConfirmDialog.js";

/*
 * The workflow has running reviews (R278, QBZ-19): the count text, the blocking reviews (each a
 * link to its content), the closing note and only Close.
 */
export const BlockedDeleteDialog = (props: EditorDialogProps) => {
    const { dialog } = props;

    let reviews: React.ReactNode = null;
    if (dialog.reviews.length > 0) {
        reviews = (
            <ul data-testid="blocked-reviews" className="flex flex-col gap-sm">
                {dialog.reviews.map(review => (
                    <li key={review.reviewId}>
                        <a
                            href={review.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col"
                        >
                            <Text as="span" size="md" className="font-semibold">
                                {review.title}
                            </Text>
                            <Text as="span" size="sm" className="text-neutral-strong">
                                {review.position}
                            </Text>
                        </a>
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <EditorConfirmDialog {...props} testId="blocked-delete-dialog">
            {reviews}
        </EditorConfirmDialog>
    );
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/dialogs/DeleteStepDialog.tsx`:

```tsx
import React from "react";
import { EditorConfirmDialog } from "./EditorConfirmDialog.js";
import type { EditorDialogProps } from "./EditorConfirmDialog.js";

// Confirm removing a step from the draft (R278): Cancel / Delete step.
export const DeleteStepDialog = (props: EditorDialogProps) => {
    return <EditorConfirmDialog {...props} testId="delete-step-dialog" />;
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/dialogs/ReloadWorkflowDialog.tsx`:

```tsx
import React from "react";
import { EditorConfirmDialog } from "./EditorConfirmDialog.js";
import type { EditorDialogProps } from "./EditorConfirmDialog.js";

// Reload the model's existing workflow after a duplicate-model error (R276, QBZ-18): Keep editing / Reload.
export const ReloadWorkflowDialog = (props: EditorDialogProps) => {
    return <EditorConfirmDialog {...props} testId="reload-workflow-dialog" />;
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/dialogs/WorkflowEditorDialogs.tsx`:

```tsx
import React from "react";
import type { WorkflowEditorDialogKind } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowEditorDialogVm } from "~/editor/presentation/editor/abstractions.js";
import { BlockedDeleteDialog } from "./BlockedDeleteDialog.js";
import { ConflictDialog } from "./ConflictDialog.js";
import { DeleteStepDialog } from "./DeleteStepDialog.js";
import { DeleteWorkflowDialog } from "./DeleteWorkflowDialog.js";
import { DeletedDialog } from "./DeletedDialog.js";
import { DiscardChangesDialog } from "./DiscardChangesDialog.js";
import type { EditorDialogProps } from "./EditorConfirmDialog.js";
import { ReloadWorkflowDialog } from "./ReloadWorkflowDialog.js";

export interface WorkflowEditorDialogsProps {
    dialog: WorkflowEditorDialogVm | null;
    onConfirm(): void;
    onCancel(): void;
}

const DIALOGS: Record<WorkflowEditorDialogKind, React.ComponentType<EditorDialogProps>> = {
    discardChanges: DiscardChangesDialog,
    conflict: ConflictDialog,
    deleted: DeletedDialog,
    deleteWorkflow: DeleteWorkflowDialog,
    blockedDelete: BlockedDeleteDialog,
    deleteStep: DeleteStepDialog,
    reloadWorkflow: ReloadWorkflowDialog
};

// Mounts the dialog component of the presenter's `vm.dialog` kind, or nothing.
export const WorkflowEditorDialogs = ({ dialog, onConfirm, onCancel }: WorkflowEditorDialogsProps) => {
    if (dialog === null) {
        return null;
    }

    const Dialog = DIALOGS[dialog.kind];
    return <Dialog dialog={dialog} onConfirm={onConfirm} onCancel={onCancel} />;
};
```

Modify `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.tsx`. Add the import after `import { StepTypePicker } from "./StepTypePicker.js";`:

```tsx
import { WorkflowEditorDialogs } from "./dialogs/WorkflowEditorDialogs.js";
```

and replace the line

```tsx
            {picker}
```

with

```tsx
            {picker}
            <WorkflowEditorDialogs
                dialog={vm.dialog}
                onConfirm={() => presenter.confirmDialog()}
                onCancel={() => presenter.cancelDialog()}
            />
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/components/dialogs/WorkflowEditorDialogs.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutFlow.test.tsx 2>&1 | tail -30
```

Expected: PASS. Notes for the first run: (a) the Radix dialog marks its own subtree accessible, so `getByRole("button", { name })` finds the footer buttons; (b) the close-button case finds the dialog's close `IconButton` as the only enabled button without text; (c) the "cannot dismiss … Escape" and "busy" cases wait 20 ms for a handler that never runs, which keeps the negative assertion honest; if a first run is flaky, replace the wait with two `await Promise.resolve()` turns; (d) the class assertions read the variant's classes (`bg-destructive` for the destructive confirm, none for the others).

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/components/dialogs/WorkflowEditorDialogs.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutFlow.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors. A type error on `DIALOGS` (a missing or extra kind) means Tasks 9 and 10 changed `WorkflowEditorDialogKind`; add or remove the entry and its one-line component.

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-workflows): add the workflow editor dialogs" -m "The view renders the presenter's dialog with one component per kind: discard changes, conflict, deleted, delete workflow, blocked delete (count text, up to five linked reviews, closing note, only Close), delete step and reload workflow. Texts and flags come from the view model; the primary and secondary buttons call the presenter." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **No new DI feature, nothing to register.** The dialogs are components over `vm.dialog`.
- **The dialog VM is Tasks 9 and 10's** (`WorkflowEditorDialogVm` with `note`, `reviews[{ reviewId, title, position, url }]`, `destructive`, `cancelDestructive`, `busy`; no `dismissible`). The view derives dismissibility from the kind: only `deleted` is not dismissible (its two buttons decide the draft). If Task 10 adds a kind, add its one-line component and its entry in `DIALOGS` (the `Record` type fails the build otherwise).
- **Two commands for every dialog** (`confirmDialog()` and `cancelDialog()`, Task 9: "`cancelDialog()` is the secondary button of every kind"): this task routes the primary button to the first and the secondary button, Escape, the overlay and the close button to the second. The switch-automation confirmation of Task 12 is the drawer's own dialog, not a kind of this union.
- **The contract says "one dialog component per kind":** seven kind components exist, six are one-line wrappers over the shared `EditorConfirmDialog` (each fixes its `data-testid`; `DeletedDialog` also makes the dialog non-dismissible); only the blocked dialog adds content (the review list).
- **The cap of five reviews, the count sentence and the `reassign` branch of the note** are built by the presenter (Task 10, R278); this task's tests render five rows and the note as given. The presenter's tests, not these, pin the cap and the two notes.
- **Note placement:** Task 9 describes `note` as "a closing sentence below the list"; the prototype puts the closing sentence in the same paragraph as the count, before the list. This task follows the view model (a separate paragraph below the list).
- **No dialog icons.** The prototype's dialogs carry an icon (for example `block` on the blocked dialog); the contract lists none and the 8a dialogs have none, so none is built.
- **Destructive variant:** added to admin-ui `Button` in Part A (user answer Q47); `Dialog.ConfirmAction` is not used because it forces `primary`. The icon-button, tag and alert variants are untouched.
- **Accessible names:** accepted by the user (Q48).
