### Task 10: Save and delete

R267 (error data), R273, R276, R277, R278, R279, R281; D92, D108, D115, D123, D131; Q41, Q43; QBZ-10, QBZ-11, QBZ-12, QBZ-18, QBZ-19, QBZ-44, QBZ-94; Review Focus 1, 2, 7, 8 (`00-shared.md`). The phase 9a Global Constraints, the 8b Global Constraints and the 8a Global Constraints and Rulings R202-R252 apply unchanged (read: R220 inline `try`/`catch` and error mapping by `code`, no helper that wraps a dependency call, no stateless private methods, one function per file, one named import per line, comments end with a period, targeted tests, the pre-commit chain).

This task adds to the presenter of Tasks 9 and 9b (as hunks against the files they leave): client validation, the store call with the loaded `savedOn`, the mapping of every failure onto the step, the field, a dialog or a banner, Save as new, Reload, and delete with its blocked case. After a successful save and delete it clears the review cache (R277). The presenter stays the only owner of the draft; the view gets VMs.

- **Save (R276).** `save()` does nothing unless the draft is dirty and not already saving. Client validation first (`validateWorkflowDraft`, Task 8). On failure: `nameError`, `stepsError` and the step errors are set, the first failing card is requested to scroll into view (`vm.scrollRequest { stepId, nonce }`), and the toast is `Fix the highlighted steps before saving.` (or `Fix the highlighted fields before saving.` when only the name or the step count is wrong); nothing is sent. Then `storeWorkflow({ data: draft.toInput(), savedOn: draft.savedOn })`: the loaded `savedOn` string goes back unchanged, `null` for a new draft (Review Focus 1). The draft stays dirty on every failure.
- **Success.** The returned workflow becomes the baseline, the open row gets the bound id and name, all errors and banners clear, `reviewUseCases.invalidateWorkflows()` is called once (R277, Review Focus 8), the toast is `Workflow saved`.
- **Failures** (`mapSaveError` decides by `GraphQLOperationError.code` and `data`, R267; a plain `Error` is a transport failure):
  - `Validation` with a `stepId` of a step in the draft: that card shows the server message as its strip, the field error is kept under its `field` (an empty `field`, for a message that names none, is `""` and matches no form field, so the drawer shows it at the top, Task 14), the card scrolls into view, toast `Could not save. Check the highlighted step.`; editing the step clears it (Task 9 `updateStep`). A `stepId` that is not in the draft is handled like any other validation error.
  - `Validation` with a `workflowId` (the model already has a workflow): the presenter reads the other workflow's name with `getWorkflow(workflowId)`, falling back to the open row's bound workflow name; with a name it shows the banner `Could not save the workflow — {Model} already has a workflow: “{name}”. A model can have one workflow.` (WB: `Could not save the workflow — Pages already have a workflow: “{name}”. Pages can have one workflow.`) with Reload; Reload opens `Reload workflow?` / `Your unsaved draft for {Model} is lost, and the existing workflow “{name}” opens.` (Keep editing / Reload), and confirming loads that workflow. Without any name the banner is the generic one below (no Reload).
  - `Validation` with `field` `name` or `steps` and no `stepId`: the name input or the `No steps yet` box is marked with the message and the banner `Could not save the workflow — {server message}` shows.
  - any other `Validation`, and any other server error (`Persistence`, `NotAuthorized`, an unknown code): the banner `Could not save the workflow — {server message}`.
  - `Conflict`: dialog `Someone else changed this workflow` (body names `savedBy.displayName`, else `Someone`), Keep editing / Reload workflow; Reload loads the draft's id again, replaces the draft and toasts `Loaded the latest version`. The draft is replaced only after the dialog is confirmed (Review Focus 1); a failed reload keeps the dialog open.
  - `NotFound`: dialog `This workflow was deleted` with `Discard changes` (the draft closes, the row loses its workflow, the model's empty state shows) and `Save as new workflow` (same id, `savedOn` null, toast `Saved as a new workflow`).
  - transport error: the banner `Could not save the workflow` / `The server did not respond, so nothing was saved. Your changes are kept.` with Try again (toast `Retrying…`, then save again) and dismiss.
- **Delete (R278, QBZ-19).** `requestDelete()` opens `Delete workflow?` for a workflow that exists on the server (a new draft has nothing to delete). Confirming calls `deleteWorkflow(id)`; success closes the draft, unbinds the row, calls `invalidateWorkflows()` and toasts `Workflow deleted`. `HasActiveReviews` replaces the dialog with `This workflow can't be deleted yet`: the count text, up to 5 reviews (`{title}`, `Step {n} of {N} · {step}`, each linked through the app's content adapter with `ReviewContentRef { namespace: review.model, targetId, targetRevisionId, contentTypeId: null }`), the closing sentence chosen by the viewer's `reassign` permission, only Close. A `NotFound` on delete means it is gone: treated as deleted. Any other failure closes the dialog and toasts the server message (transport: the 8a text `The server did not respond, so nothing was changed. Try again.`); the workflow stays open.

**Files:** (all under `packages/app-workflows/src`)
- Create: `editor/presentation/editor/mapSaveError.ts`
- Create: `editor/presentation/editor/readBlockedDeleteData.ts`
- Create: `editor/presentation/editor/SaveBannerState.ts`
- Create: `editor/presentation/editor/duplicateBannerMessage.ts`
- Create: `editor/presentation/editor/toMessageBanner.ts`
- Create: `editor/presentation/editor/dialogs/conflictDialog.ts`
- Create: `editor/presentation/editor/dialogs/deletedDialog.ts`
- Create: `editor/presentation/editor/dialogs/deleteWorkflowDialog.ts`
- Create: `editor/presentation/editor/dialogs/blockedDeleteDialog.ts`
- Create: `editor/presentation/editor/dialogs/reloadWorkflowDialog.ts`
- Modify: `editor/presentation/editor/abstractions.ts`
- Modify: `editor/presentation/editor/PendingDialog.ts`
- Modify: `editor/presentation/editor/WorkflowEditorPresenter.ts`
- Create (tests): `editor/presentation/editor/mapSaveError.test.ts`, `editor/presentation/editor/readBlockedDeleteData.test.ts`, `editor/presentation/editor/duplicateBannerMessage.test.ts`, `editor/presentation/editor/dialogs/saveDialogs.test.ts`, `editor/presentation/editor/WorkflowEditorPresenter.save.test.ts`, `editor/presentation/editor/WorkflowEditorPresenter.saveFailures.test.ts`, `editor/presentation/editor/WorkflowEditorPresenter.delete.test.ts`

**Interfaces:**
- Consumes: Tasks 9 and 9b (the presenter, `createEditorPresenterSetup` with `useCases`, `toasts`, `reviewUseCases`, `app`, `createDeferred`, `PendingDialog`, `bindWorkflow`, `beginOpen`, `resolveTeams`, `applyRemoveStep`, `openStepId`, `scrollRequest`, the dialog VM), Task 8 (`WorkflowDraft.toInput/savedOn/detachBaseline/reset`, `validateWorkflowDraft`, `WorkflowDraftErrors`, `StepValidationErrors`, `isAiEditable`), Task 5 (`StoreWorkflowParams { data; savedOn }` from `~/editor/gateway/IWorkflowEditorGateway.js`, `WorkflowErrorCode`, `WorkflowEditorToasts` token and `IWorkflowEditorToasts { success; error; info }`, `EDITOR_SAVED_ON`, `createEditorWorkflow`, the fakes), Task 6 (`invalidateWorkflows` on `IReviewReadUseCases` and on `createFakeUseCases`). Existing (verified): `GraphQLOperationError` (`code`, `data: unknown`), `getWorkflowsPermissionSet(identity).reassign`, `BlockingReview` (`~/review/domain/types.js`, fields `reviewId`, `model`, `targetId`, `targetRevisionId`, `title`, `stepPosition`, `stepCount`, `stepName`), `IReviewContentAdapter.getContentUrl(ref)`.
- Produces: presenter members `save`, `retrySave`, `dismissBanner`, `reloadDuplicate`, `requestDelete`; `vm.saveBanner: SaveBannerVm | null` (`kind` `message` | `duplicate` | `transport`, `title`, `message`, `canReload`, `canRetry`, `dismissible`); the dialog kinds `conflict`, `deleted`, `deleteWorkflow`, `blockedDelete`, `reloadWorkflow`; `mapSaveError` and `SaveFailure`; `readBlockedDeleteData`; `duplicateBannerMessage`. Tasks 15, 18 and 19 render them (Task 15 reads `save`, `requestDelete` and `header.saving`).

**Test runner note:** admin package, `yarn test <path>` only. The presenter tests reuse `createEditorPresenterSetup` from Task 9 and `createDeferred` from Task 6 and mock the id generator as Task 9's flow test does.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/presentation/editor/mapSaveError.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { mapSaveError } from "./mapSaveError.js";

const operationError = (code: string, data: unknown = null, message = "Failed."): Error => {
    return new GraphQLOperationError({ message, code, data });
};

describe("mapSaveError (R267, R276)", () => {
    it("reads the validation data", () => {
        const error = operationError(
            WorkflowErrorCode.Validation,
            { stepId: "step-1", field: "config.teams", workflowId: null },
            "Step needs a team."
        );

        expect(mapSaveError(error)).toEqual({
            kind: "validation",
            message: "Step needs a team.",
            stepId: "step-1",
            field: "config.teams",
            workflowId: null
        });
    });

    it("reads the other workflow's id of a duplicate-model error", () => {
        const error = operationError(WorkflowErrorCode.Validation, {
            stepId: null,
            field: "models",
            workflowId: "workflow-9"
        });

        expect(mapSaveError(error)).toMatchObject({
            kind: "validation",
            stepId: null,
            field: "models",
            workflowId: "workflow-9"
        });
    });

    it("treats missing or malformed validation data as nulls", () => {
        expect(mapSaveError(operationError(WorkflowErrorCode.Validation))).toMatchObject({
            kind: "validation",
            stepId: null,
            field: null,
            workflowId: null
        });
        const malformed = operationError(WorkflowErrorCode.Validation, {
            stepId: 5,
            field: {},
            workflowId: ""
        });
        expect(mapSaveError(malformed)).toMatchObject({
            stepId: null,
            field: null,
            workflowId: null
        });
    });

    it("names who saved the newer version of a conflict, else Someone (Q43)", () => {
        const named = operationError(WorkflowErrorCode.Conflict, {
            savedOn: "2026-10-18T10:00:00.000Z",
            savedBy: { id: "user-2", displayName: "Grace Hopper" }
        });
        const anonymous = operationError(WorkflowErrorCode.Conflict, { savedOn: "x" });
        const empty = operationError(WorkflowErrorCode.Conflict, { savedBy: { displayName: "" } });

        expect(mapSaveError(named)).toEqual({ kind: "conflict", savedByName: "Grace Hopper" });
        expect(mapSaveError(anonymous)).toEqual({ kind: "conflict", savedByName: "Someone" });
        expect(mapSaveError(empty)).toEqual({ kind: "conflict", savedByName: "Someone" });
    });

    it("maps NotFound", () => {
        expect(mapSaveError(operationError(WorkflowErrorCode.NotFound, { id: "w" }))).toEqual({
            kind: "notFound"
        });
    });

    it("maps every other server error to its message", () => {
        const persistence = operationError(WorkflowErrorCode.Persistence, null, "Disk full.");
        const unknown = operationError("Something/Else", null, "Odd.");

        expect(mapSaveError(persistence)).toEqual({ kind: "server", message: "Disk full." });
        expect(mapSaveError(unknown)).toEqual({ kind: "server", message: "Odd." });
    });

    it("maps a plain error and anything else to a transport failure", () => {
        expect(mapSaveError(new Error("Failed to fetch"))).toEqual({ kind: "transport" });
        expect(mapSaveError("boom")).toEqual({ kind: "transport" });
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/readBlockedDeleteData.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { readBlockedDeleteData } from "./readBlockedDeleteData.js";

const review = (id: string) => {
    return {
        reviewId: id,
        model: "cms.article",
        targetId: `target-${id}`,
        targetRevisionId: `target-${id}#0001`,
        title: `Title ${id}`,
        stepPosition: 2,
        stepCount: 3,
        stepName: "Legal sign-off"
    };
};

describe("readBlockedDeleteData (R278)", () => {
    it("reads the count and the reviews", () => {
        const result = readBlockedDeleteData({ count: 7, reviews: [review("r1"), review("r2")] });

        expect(result.count).toBe(7);
        expect(result.reviews).toEqual([review("r1"), review("r2")]);
    });

    it("falls back to the number of reviews when the count is missing", () => {
        expect(readBlockedDeleteData({ reviews: [review("r1")] }).count).toBe(1);
    });

    it("skips an entry that is not a review and survives garbage", () => {
        const result = readBlockedDeleteData({ count: 2, reviews: [review("r1"), { reviewId: 5 }, null] });

        expect(result.reviews.map(item => item.reviewId)).toEqual(["r1"]);
        expect(readBlockedDeleteData(null)).toEqual({ count: 0, reviews: [] });
        expect(readBlockedDeleteData("x")).toEqual({ count: 0, reviews: [] });
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/duplicateBannerMessage.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { duplicateBannerMessage } from "./duplicateBannerMessage.js";

describe("duplicateBannerMessage (QBZ-44)", () => {
    it("words the CMS banner with the model and the other workflow", () => {
        expect(
            duplicateBannerMessage({ appKind: "cms", modelName: "Article", workflowName: "Article approval" })
        ).toBe(
            "Could not save the workflow — Article already has a workflow: “Article approval”. A model can have one workflow."
        );
    });

    it("words the Website Builder banner for pages", () => {
        expect(
            duplicateBannerMessage({ appKind: "wb", modelName: "Pages", workflowName: "Pages approval" })
        ).toBe(
            "Could not save the workflow — Pages already have a workflow: “Pages approval”. Pages can have one workflow."
        );
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/dialogs/saveDialogs.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { blockedDeleteDialog } from "./blockedDeleteDialog.js";
import { conflictDialog } from "./conflictDialog.js";
import { deleteWorkflowDialog } from "./deleteWorkflowDialog.js";
import { deletedDialog } from "./deletedDialog.js";
import { reloadWorkflowDialog } from "./reloadWorkflowDialog.js";

describe("conflictDialog (D131)", () => {
    it("names who saved and which workflow", () => {
        expect(conflictDialog({ savedByName: "Grace Hopper", workflowName: "Article review" })).toEqual({
            kind: "conflict",
            title: "Someone else changed this workflow",
            body: "Grace Hopper saved a newer version of “Article review” while you were editing, so your changes were not saved. Reload to get the latest version. Reloading discards your unsaved changes.",
            note: null,
            reviews: [],
            confirmLabel: "Reload workflow",
            cancelLabel: "Keep editing",
            destructive: false,
            cancelDestructive: false,
            busy: false
        });
    });

    it("says this workflow for an unnamed workflow", () => {
        expect(conflictDialog({ savedByName: "Someone", workflowName: " " }).body).toContain(
            "Someone saved a newer version of “this workflow” while"
        );
    });
});

describe("deletedDialog (QBZ-94)", () => {
    it("offers to save as new or discard", () => {
        expect(deletedDialog({ workflowName: "Article review", modelName: "Article" })).toEqual({
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
        });
    });
});

describe("deleteWorkflowDialog (QBZ-19)", () => {
    it("names the workflow and the model", () => {
        expect(deleteWorkflowDialog({ workflowName: "Article review", modelName: "Article" })).toEqual({
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
        });
    });
});

describe("blockedDeleteDialog (QBZ-19)", () => {
    const reviews = [
        { reviewId: "r1", title: "Spring campaign", position: "Step 2 of 3 · Legal sign-off", url: "/a" }
    ];

    it("counts in the singular and offers Close only", () => {
        const dialog = blockedDeleteDialog({
            workflowName: "Article review",
            count: 1,
            reviews,
            canReassign: true
        });

        expect(dialog).toEqual({
            kind: "blockedDelete",
            title: "This workflow can't be deleted yet",
            body: "1 review using “Article review” is in progress.",
            note: "Wait for them to finish, or open each one and cancel it. Then try again.",
            reviews,
            confirmLabel: null,
            cancelLabel: "Close",
            destructive: false,
            cancelDestructive: false,
            busy: false
        });
    });

    it("counts in the plural and sends a viewer without reassign to someone who has it", () => {
        const dialog = blockedDeleteDialog({
            workflowName: "Article review",
            count: 7,
            reviews,
            canReassign: false
        });

        expect(dialog.body).toBe("7 reviews using “Article review” are in progress.");
        expect(dialog.note).toBe(
            "Wait for them to finish, or ask someone with Reassign and operate to cancel them. Then try again."
        );
    });
});

describe("reloadWorkflowDialog (QBZ-18)", () => {
    it("names the model and the existing workflow", () => {
        expect(reloadWorkflowDialog({ modelName: "Article", workflowName: "Article approval" })).toEqual({
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
        });
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.save.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { EDITOR_SAVED_ON } from "~/editor/testing/editorFixtures.js";
import { createEditorStep } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPage } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelRow } from "~/editor/testing/editorFixtures.js";

const ids = vi.hoisted(() => {
    return { next: 0 };
});

vi.mock("@webiny/utils/generateId.js", () => {
    return {
        generateAlphaNumericId: () => {
            ids.next += 1;
            return `id-${ids.next}`;
        }
    };
});

beforeEach(() => {
    ids.next = 0;
});

const NEW_SAVED_ON = "2026-10-19T11:00:00.456Z";

describe("WorkflowEditorPresenter: save (R276, Review Focus 1)", () => {
    it("cannot save a clean draft", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        await presenter.init(params);

        expect(presenter.vm.header?.canSave).toBe(false);
        await presenter.save();

        expect(useCases.storeWorkflow).not.toHaveBeenCalled();
    });

    it("sends the draft with the loaded savedOn string unchanged", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.setName("Changed");

        await presenter.save();

        expect(useCases.storeWorkflow).toHaveBeenCalledTimes(1);
        const call = useCases.storeWorkflow.mock.calls[0][0];
        expect(call.savedOn).toBe(EDITOR_SAVED_ON);
        expect(call.data.id).toBe("workflow-1");
        expect(call.data.name).toBe("Changed");
        expect(call.data.models).toEqual(["cms.article"]);
        expect(call.data.steps[0].notifications).toEqual([{ id: "e-mail" }]);
    });

    it("makes the returned workflow the baseline, updates the row, clears the review cache and toasts", async () => {
        const { presenter, params, useCases, reviewUseCases, toasts } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.setName("Renamed");
        const saved: EditorWorkflow = createEditorWorkflow({ name: "Renamed", savedOn: NEW_SAVED_ON });
        useCases.storeWorkflow.mockResolvedValue(saved);

        await presenter.save();

        expect(presenter.vm.header).toMatchObject({ name: "Renamed", dirty: false, saving: false, canSave: false });
        expect(presenter.vm.panel.rows[0].subLine).toBe("1 step");
        expect(reviewUseCases.invalidateWorkflows).toHaveBeenCalledTimes(1);
        expect(toasts.success).toHaveBeenCalledWith("Workflow saved");
        expect(presenter.vm.saveBanner).toBeNull();

        presenter.setName("Again");
        await presenter.save();
        expect(useCases.storeWorkflow.mock.calls[1][0].savedOn).toBe(NEW_SAVED_ON);
    });

    it("saves a new draft with a null savedOn and binds the row to it", async () => {
        const setup = createEditorPresenterSetup();
        setup.useCases.listModels.mockResolvedValue(
            createWorkflowModelPage({ rows: [createWorkflowModelRow({ workflow: null })] })
        );
        await setup.presenter.init(setup.params);
        setup.presenter.createWorkflow();
        const stepId = setup.presenter.addStep(0, "review") ?? "";
        setup.presenter.updateStep(stepId, {
            title: "Legal",
            config: {
                teams: ["team-1"],
                assignment: { strategy: "none", allowManualPick: false, rules: [] }
            }
        });
        setup.useCases.storeWorkflow.mockResolvedValue(
            createEditorWorkflow({ id: "id-1", name: "Article review", steps: [createEditorStep({ id: stepId, title: "Legal" })] })
        );

        await setup.presenter.save();

        const call = setup.useCases.storeWorkflow.mock.calls[0][0];
        expect(call.savedOn).toBeNull();
        expect(call.data.steps[0].config).toEqual({
            teams: ["team-1"],
            assignment: { strategy: "none", allowManualPick: false, rules: [] }
        });
        expect(setup.presenter.vm.panel.rows[0]).toMatchObject({ bound: true, subLine: "1 step" });
        expect(setup.presenter.vm.header?.canDelete).toBe(true);
    });

    it("shows saving and ignores a second save while one is running", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.setName("Changed");
        const pending = createDeferred<EditorWorkflow>();
        useCases.storeWorkflow.mockReturnValue(pending.promise);

        const first = presenter.save();
        await presenter.save();

        expect(useCases.storeWorkflow).toHaveBeenCalledTimes(1);
        expect(presenter.vm.header).toMatchObject({ saving: true, canSave: false });

        pending.resolve(createEditorWorkflow({ name: "Changed", savedOn: NEW_SAVED_ON }));
        await first;

        expect(presenter.vm.header?.saving).toBe(false);
    });
});

describe("WorkflowEditorPresenter: client validation (R276, QBZ-12, Review Focus 2)", () => {
    it("marks an empty name, sends nothing and toasts the fields message", async () => {
        const { presenter, params, useCases, toasts } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.setName("  ");

        await presenter.save();

        expect(useCases.storeWorkflow).not.toHaveBeenCalled();
        expect(presenter.vm.header?.nameError).toBe("Enter a workflow name.");
        expect(toasts.error).toHaveBeenCalledWith("Fix the highlighted fields before saving.");
        expect(presenter.vm.header?.dirty).toBe(true);

        presenter.setName("Fixed");
        expect(presenter.vm.header?.nameError).toBeNull();
    });

    it("marks the step count when there is no step", async () => {
        const { presenter, params, toasts } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.requestDeleteStep("step-1");
        await presenter.confirmDialog();

        await presenter.save();

        expect(presenter.vm.flow.stepsError).toBe("Add at least one step.");
        expect(toasts.error).toHaveBeenCalledWith("Fix the highlighted fields before saving.");
    });

    it("marks a step, scrolls to it and toasts the steps message", async () => {
        const { presenter, params, toasts } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.updateStep("step-1", { title: "" });

        await presenter.save();

        expect(presenter.vm.flow.steps[0].error).toBe("Enter a title for this step.");
        expect(presenter.getStepFieldErrors("step-1")).toEqual([
            { field: "title", message: "Enter a title for this step." }
        ]);
        expect(presenter.vm.scrollRequest).toEqual({ stepId: "step-1", nonce: 1 });
        expect(toasts.error).toHaveBeenCalledWith("Fix the highlighted steps before saving.");

        await presenter.save();
        expect(presenter.vm.scrollRequest).toEqual({ stepId: "step-1", nonce: 2 });

        presenter.updateStep("step-1", { title: "Fixed" });
        expect(presenter.vm.flow.steps[0].error).toBeNull();
        expect(presenter.getStepFieldErrors("step-1")).toEqual([]);
    });

    it("needs a reviewing team", async () => {
        const { presenter, params } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.updateStep("step-1", { config: { teams: [], assignment: null } });

        await presenter.save();

        expect(presenter.getStepFieldErrors("step-1")).toEqual([
            { field: "config.teams", message: "Choose at least one reviewing team." }
        ]);
    });

    it("blocks an invalid custom hex colour", async () => {
        const { presenter, params } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.updateStep("step-1", { color: "#12" });

        await presenter.save();

        expect(presenter.getStepFieldErrors("step-1")[0]).toEqual({
            field: "color",
            message: "Enter a hex colour, e.g. #3B6FD4."
        });
    });

    it("names a required automation setting", async () => {
        const { presenter, params } = createEditorPresenterSetup();
        await presenter.init(params);
        const id = presenter.addStep(1, "automation") ?? "";
        presenter.updateStep(id, {
            title: "Notify",
            config: { automationId: "send-webhook", settings: {} }
        });

        await presenter.save();

        expect(presenter.getStepFieldErrors(id)).toEqual([
            { field: "config.settings.url", message: "URL is required." }
        ]);
    });
});

describe("WorkflowEditorPresenter: more client validation (R276, M10.3)", () => {
    it("toasts the steps message when the name and a step are both wrong", async () => {
        const { presenter, params, useCases, toasts } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.setName("");
        presenter.updateStep("step-1", { title: "" });

        await presenter.save();

        expect(useCases.storeWorkflow).not.toHaveBeenCalled();
        expect(presenter.vm.header?.nameError).toBe("Enter a workflow name.");
        expect(presenter.vm.flow.steps[0].error).toBe("Enter a title for this step.");
        expect(toasts.error).toHaveBeenCalledWith("Fix the highlighted steps before saving.");
    });

    it("needs instructions and a model for an AI step while the AI editor exists", async () => {
        const { presenter, params } = createEditorPresenterSetup();
        await presenter.init(params);
        const id = presenter.addStep(1, "ai") ?? "";
        presenter.updateStep(id, { title: "Tone" });

        await presenter.save();

        expect(presenter.getStepFieldErrors(id)).toEqual([
            { field: "config.instructions", message: "Enter instructions for the AI." },
            { field: "config.model", message: "Choose an AI model." }
        ]);
    });
});

describe("WorkflowEditorPresenter: a save in flight (R277, Review Focus 8)", () => {
    const withTwoModels = () => {
        const setup = createEditorPresenterSetup();
        setup.useCases.listModels.mockResolvedValue(
            createWorkflowModelPage({
                rows: [
                    createWorkflowModelRow(),
                    createWorkflowModelRow({
                        model: "cms.press",
                        modelId: "press",
                        name: "Press",
                        workflow: { id: "workflow-2", name: "Press approval" }
                    })
                ]
            })
        );
        return setup;
    };

    it("ignores a model switch while the store call runs, then finishes cleanly", async () => {
        const { presenter, params, useCases, reviewUseCases, toasts } = withTwoModels();
        await presenter.init(params);
        presenter.setName("Changed");
        const pending = createDeferred<EditorWorkflow>();
        useCases.storeWorkflow.mockReturnValue(pending.promise);
        useCases.getWorkflow.mockClear();

        const saving = presenter.save();
        await presenter.selectModel("press");

        expect(presenter.vm.dialog).toBeNull();
        expect(useCases.getWorkflow).not.toHaveBeenCalled();
        expect(presenter.vm.header?.saving).toBe(true);

        pending.resolve(createEditorWorkflow({ name: "Changed", savedOn: NEW_SAVED_ON }));
        await saving;

        expect(presenter.vm.header).toMatchObject({ name: "Changed", saving: false, dirty: false });
        expect(reviewUseCases.invalidateWorkflows).toHaveBeenCalledTimes(1);
        expect(toasts.success).toHaveBeenCalledWith("Workflow saved");
        expect(presenter.vm.panel.rows.map(row => row.active)).toEqual([true, false]);
    });

    it("clears the review cache even when the editor was disposed while the store ran", async () => {
        const { presenter, params, useCases, reviewUseCases, toasts } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.setName("Changed");
        const pending = createDeferred<EditorWorkflow>();
        useCases.storeWorkflow.mockReturnValue(pending.promise);

        const saving = presenter.save();
        presenter.dispose();
        pending.resolve(createEditorWorkflow({ name: "Changed", savedOn: NEW_SAVED_ON }));
        await saving;

        expect(reviewUseCases.invalidateWorkflows).toHaveBeenCalledTimes(1);
        expect(toasts.success).not.toHaveBeenCalled();
        expect(presenter.vm.header).toBeNull();
    });

    it("keeps the open step open after a successful save (same step ids, R284)", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.openStep("step-1");
        presenter.setName("Changed");
        useCases.storeWorkflow.mockResolvedValue(
            createEditorWorkflow({ name: "Changed", savedOn: NEW_SAVED_ON })
        );

        await presenter.save();

        expect(presenter.vm.openStepId).toBe("step-1");
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.saveFailures.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPage } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelRow } from "~/editor/testing/editorFixtures.js";

const NEW_SAVED_ON = "2026-10-19T11:00:00.456Z";

const failure = (code: string, data: unknown, message: string): GraphQLOperationError => {
    return new GraphQLOperationError({ code, data, message });
};

const dirtySetup = async (appKind: "cms" | "wb" = "cms") => {
    const setup = createEditorPresenterSetup({ appKind });
    if (appKind === "wb") {
        setup.useCases.listModels.mockResolvedValue(
            createWorkflowModelPage({
                rows: [
                    createWorkflowModelRow({
                        model: "wb.page",
                        modelId: "page",
                        name: "Pages",
                        workflow: { id: "workflow-1", name: "Pages review" }
                    })
                ]
            })
        );
    }
    await setup.presenter.init(setup.params);
    setup.presenter.setName("Changed");
    return setup;
};

describe("WorkflowEditorPresenter: server validation (R267, R276, Q41)", () => {
    it("marks the step and the field the server names, scrolls to it and toasts", async () => {
        const { presenter, useCases, toasts, reviewUseCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(
            failure(
                WorkflowErrorCode.Validation,
                { stepId: "step-1", field: "config.teams", workflowId: null },
                "Step needs a team."
            )
        );

        await presenter.save();

        expect(presenter.vm.flow.steps[0].error).toBe("Step needs a team.");
        expect(presenter.getStepFieldErrors("step-1")).toEqual([
            { field: "config.teams", message: "Step needs a team." }
        ]);
        expect(presenter.vm.scrollRequest).toEqual({ stepId: "step-1", nonce: 1 });
        expect(toasts.error).toHaveBeenCalledWith("Could not save. Check the highlighted step.");
        expect(presenter.vm.saveBanner).toBeNull();
        expect(presenter.vm.header).toMatchObject({ dirty: true, saving: false });
        expect(reviewUseCases.invalidateWorkflows).not.toHaveBeenCalled();

        presenter.updateStep("step-1", { title: "Edited" });
        expect(presenter.vm.flow.steps[0].error).toBeNull();
    });

    it("keeps a field-less step error under an empty field so the drawer shows it at the top", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(
            failure(
                WorkflowErrorCode.Validation,
                { stepId: "step-1", field: null, workflowId: null },
                "Step is odd."
            )
        );

        await presenter.save();

        expect(presenter.getStepFieldErrors("step-1")).toEqual([{ field: "", message: "Step is odd." }]);
    });

    it("treats a step id that is not in the draft as a plain message", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(
            failure(
                WorkflowErrorCode.Validation,
                { stepId: "gone", field: "title", workflowId: null },
                "Step gone needs a title."
            )
        );

        await presenter.save();

        expect(presenter.vm.flow.steps[0].error).toBeNull();
        expect(presenter.vm.saveBanner).toEqual({
            kind: "message",
            title: null,
            message: "Could not save the workflow — Step gone needs a title.",
            canReload: false,
            canRetry: false,
            dismissible: false
        });
    });

    it("marks the name input and shows the banner for a workflow-level name error", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(
            failure(
                WorkflowErrorCode.Validation,
                { stepId: null, field: "name", workflowId: null },
                "Workflow name is required."
            )
        );

        await presenter.save();

        expect(presenter.vm.header?.nameError).toBe("Workflow name is required.");
        expect(presenter.vm.saveBanner?.message).toBe(
            "Could not save the workflow — Workflow name is required."
        );
    });

    it("marks the steps box for a workflow-level steps error", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(
            failure(
                WorkflowErrorCode.Validation,
                { stepId: null, field: "steps", workflowId: null },
                "Add at least one step."
            )
        );

        await presenter.save();

        expect(presenter.vm.flow.stepsError).toBe("Add at least one step.");
    });

    it("shows the server message for any other validation or server error (Q43)", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValueOnce(
            failure(WorkflowErrorCode.Validation, null, "The model does not exist.")
        );

        await presenter.save();
        expect(presenter.vm.saveBanner?.message).toBe(
            "Could not save the workflow — The model does not exist."
        );

        useCases.storeWorkflow.mockRejectedValueOnce(
            failure(WorkflowErrorCode.Persistence, null, "Disk full.")
        );
        await presenter.save();
        expect(presenter.vm.saveBanner?.message).toBe("Could not save the workflow — Disk full.");
    });
});

describe("WorkflowEditorPresenter: the model already has a workflow (QBZ-18, QBZ-44)", () => {
    const duplicate = (message = "The model already has a workflow.") => {
        return failure(
            WorkflowErrorCode.Validation,
            { stepId: null, field: "models", workflowId: "workflow-9" },
            message
        );
    };

    it("names the other workflow in the CMS banner", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(duplicate());
        useCases.getWorkflow.mockResolvedValueOnce(
            createEditorWorkflow({ id: "workflow-9", name: "Article approval" })
        );

        await presenter.save();

        expect(useCases.getWorkflow).toHaveBeenLastCalledWith("workflow-9");
        expect(presenter.vm.saveBanner).toEqual({
            kind: "duplicate",
            title: null,
            message:
                "Could not save the workflow — Article already has a workflow: “Article approval”. A model can have one workflow.",
            canReload: true,
            canRetry: false,
            dismissible: false
        });
    });

    it("words the banner for pages in the Website Builder", async () => {
        const { presenter, useCases } = await dirtySetup("wb");
        useCases.storeWorkflow.mockRejectedValue(duplicate());
        useCases.getWorkflow.mockResolvedValueOnce(
            createEditorWorkflow({ id: "workflow-9", name: "Pages approval" })
        );

        await presenter.save();

        expect(presenter.vm.saveBanner?.message).toBe(
            "Could not save the workflow — Pages already have a workflow: “Pages approval”. Pages can have one workflow."
        );
    });

    it("falls back to the row's bound workflow name when the other one cannot be read", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(duplicate());
        useCases.getWorkflow.mockRejectedValueOnce(new Error("down"));

        await presenter.save();

        expect(presenter.vm.saveBanner?.message).toBe(
            "Could not save the workflow — Article already has a workflow: “Article review”. A model can have one workflow."
        );
        expect(presenter.vm.saveBanner?.canReload).toBe(true);
    });

    it("falls back to the server message, without Reload, when no name is known", async () => {
        const setup = createEditorPresenterSetup();
        setup.useCases.listModels.mockResolvedValue(
            createWorkflowModelPage({ rows: [createWorkflowModelRow({ workflow: null })] })
        );
        await setup.presenter.init(setup.params);
        setup.presenter.createWorkflow();
        setup.useCases.storeWorkflow.mockRejectedValue(duplicate("Article already has one."));
        setup.useCases.getWorkflow.mockRejectedValueOnce(new Error("down"));
        const stepId = setup.presenter.addStep(0, "review") ?? "";
        setup.presenter.updateStep(stepId, {
            title: "Legal",
            config: { teams: ["team-1"], assignment: null }
        });

        await setup.presenter.save();

        expect(setup.presenter.vm.saveBanner).toMatchObject({
            kind: "message",
            message: "Could not save the workflow — Article already has one.",
            canReload: false
        });
    });

    it("Reload asks first, keeps the draft on Keep editing and loads the other workflow on Reload", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(duplicate());
        const other = createEditorWorkflow({ id: "workflow-9", name: "Article approval", savedOn: NEW_SAVED_ON });
        useCases.getWorkflow.mockResolvedValue(other);
        await presenter.save();

        presenter.reloadDuplicate();

        expect(presenter.vm.dialog).toEqual({
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
        });

        presenter.cancelDialog();
        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header?.name).toBe("Changed");

        presenter.reloadDuplicate();
        await presenter.confirmDialog();

        expect(useCases.getWorkflow).toHaveBeenLastCalledWith("workflow-9");
        expect(presenter.vm.header).toMatchObject({ name: "Article approval", dirty: false });
        expect(presenter.vm.saveBanner).toBeNull();
        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.panel.rows[0].subLine).toBe("1 step");
    });
});

describe("WorkflowEditorPresenter: conflict (D131, Review Focus 1)", () => {
    const conflict = (savedBy: unknown) => {
        return failure(
            WorkflowErrorCode.Conflict,
            { savedOn: NEW_SAVED_ON, savedBy },
            "The workflow was changed."
        );
    };

    it("asks and keeps the draft until the admin reloads", async () => {
        const { presenter, useCases, toasts } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(
            conflict({ id: "user-2", displayName: "Grace Hopper" })
        );

        await presenter.save();

        expect(presenter.vm.dialog).toEqual({
            kind: "conflict",
            title: "Someone else changed this workflow",
            body: "Grace Hopper saved a newer version of “Changed” while you were editing, so your changes were not saved. Reload to get the latest version. Reloading discards your unsaved changes.",
            note: null,
            reviews: [],
            confirmLabel: "Reload workflow",
            cancelLabel: "Keep editing",
            destructive: false,
            cancelDestructive: false,
            busy: false
        });
        expect(presenter.vm.header).toMatchObject({ name: "Changed", dirty: true });
        expect(toasts.success).not.toHaveBeenCalled();

        presenter.cancelDialog();
        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header?.dirty).toBe(true);
    });

    it("says Someone when the server names nobody", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(conflict(null));

        await presenter.save();

        expect(presenter.vm.dialog?.body.startsWith("Someone saved a newer version")).toBe(true);
    });

    it("reloads the latest version only after the dialog is confirmed", async () => {
        const { presenter, useCases, toasts } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(conflict(null));
        await presenter.save();
        useCases.getWorkflow.mockResolvedValue(
            createEditorWorkflow({ name: "Their version", savedOn: NEW_SAVED_ON })
        );

        expect(presenter.vm.header?.name).toBe("Changed");
        await presenter.confirmDialog();

        expect(useCases.getWorkflow).toHaveBeenLastCalledWith("workflow-1");
        expect(presenter.vm.header).toMatchObject({ name: "Their version", dirty: false });
        expect(presenter.vm.dialog).toBeNull();
        expect(toasts.success).toHaveBeenCalledWith("Loaded the latest version");
    });

    it("keeps the dialog open, ready again, when the reload fails", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(conflict(null));
        await presenter.save();
        useCases.getWorkflow.mockRejectedValueOnce(new Error("down"));

        await presenter.confirmDialog();

        expect(presenter.vm.dialog?.kind).toBe("conflict");
        expect(presenter.vm.dialog?.busy).toBe(false);
        expect(presenter.vm.header?.name).toBe("Changed");
    });
});

describe("WorkflowEditorPresenter: deleted while editing (D123, QBZ-94)", () => {
    const notFound = () => {
        return failure(WorkflowErrorCode.NotFound, { id: "workflow-1" }, "Workflow not found.");
    };

    it("offers to save as new or discard", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(notFound());

        await presenter.save();

        expect(presenter.vm.dialog).toMatchObject({
            kind: "deleted",
            title: "This workflow was deleted",
            body: "“Changed” was deleted while you were editing, so your changes were not saved. Save them as a new workflow for Article, or discard them.",
            confirmLabel: "Save as new workflow",
            cancelLabel: "Discard changes",
            cancelDestructive: true
        });
        expect(presenter.vm.header?.dirty).toBe(true);
    });

    it("discards: the draft closes, the model shows its empty state and the review cache is cleared", async () => {
        const { presenter, useCases, reviewUseCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(notFound());
        await presenter.save();

        presenter.cancelDialog();

        expect(reviewUseCases.invalidateWorkflows).toHaveBeenCalledTimes(1);
        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header).toBeNull();
        expect(presenter.vm.empty?.title).toBe("Article has no workflow");
        expect(presenter.vm.panel.rows[0]).toMatchObject({ bound: false, subLine: "No workflow", unsaved: false });
    });

    it("saves as new: the same id, a null savedOn, then the success toast and the cache clear", async () => {
        const { presenter, useCases, toasts, reviewUseCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValueOnce(notFound());
        await presenter.save();
        useCases.storeWorkflow.mockResolvedValueOnce(
            createEditorWorkflow({ name: "Changed", savedOn: NEW_SAVED_ON })
        );

        await presenter.confirmDialog();

        const call = useCases.storeWorkflow.mock.calls[1][0];
        expect(call.savedOn).toBeNull();
        expect(call.data.id).toBe("workflow-1");
        expect(call.data.name).toBe("Changed");
        expect(toasts.success).toHaveBeenCalledWith("Saved as a new workflow");
        expect(reviewUseCases.invalidateWorkflows).toHaveBeenCalledTimes(1);
        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header).toMatchObject({ name: "Changed", dirty: false });
    });
});

describe("WorkflowEditorPresenter: the server did not respond (QBZ-10)", () => {
    it("shows the banner and keeps the draft dirty", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(new Error("Failed to fetch"));

        await presenter.save();

        expect(presenter.vm.saveBanner).toEqual({
            kind: "transport",
            title: "Could not save the workflow",
            message: "The server did not respond, so nothing was saved. Your changes are kept.",
            canReload: false,
            canRetry: true,
            dismissible: true
        });
        expect(presenter.vm.header).toMatchObject({ dirty: true, saving: false, canSave: true });
    });

    it("dismisses the banner", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(new Error("Failed to fetch"));
        await presenter.save();

        presenter.dismissBanner();

        expect(presenter.vm.saveBanner).toBeNull();
    });

    it("Try again toasts Retrying… and saves again", async () => {
        const { presenter, useCases, toasts } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValueOnce(new Error("Failed to fetch"));
        await presenter.save();
        useCases.storeWorkflow.mockResolvedValueOnce(
            createEditorWorkflow({ name: "Changed", savedOn: NEW_SAVED_ON })
        );

        await presenter.retrySave();

        expect(toasts.info).toHaveBeenCalledWith("Retrying…");
        expect(useCases.storeWorkflow).toHaveBeenCalledTimes(2);
        expect(presenter.vm.saveBanner).toBeNull();
        expect(presenter.vm.header?.dirty).toBe(false);
    });

    it("clears a banner when the next save starts", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValueOnce(new Error("Failed to fetch"));
        await presenter.save();
        useCases.storeWorkflow.mockResolvedValueOnce(
            createEditorWorkflow({ name: "Changed", savedOn: NEW_SAVED_ON })
        );

        await presenter.save();

        expect(presenter.vm.saveBanner).toBeNull();
    });
});

describe("WorkflowEditorPresenter: after every kind of failure (M10.3)", () => {
    const failures: Array<[string, () => Error]> = [
        ["a conflict", () => failure(WorkflowErrorCode.Conflict, null, "Changed.")],
        ["not found", () => failure(WorkflowErrorCode.NotFound, null, "Gone.")],
        [
            "a step error",
            () =>
                failure(
                    WorkflowErrorCode.Validation,
                    { stepId: "step-1", field: "title", workflowId: null },
                    "Bad."
                )
        ],
        ["a transport error", () => new Error("Failed to fetch")],
        ["a server error", () => failure(WorkflowErrorCode.Persistence, null, "Disk full.")]
    ];

    it.each(failures)("is not saving any more after %s, and can save again", async (_name, create) => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(create());

        await presenter.save();

        expect(presenter.vm.header).toMatchObject({ saving: false, dirty: true });
    });
});

describe("WorkflowEditorPresenter: Save as new that fails (QBZ-94)", () => {
    it("keeps the draft new and unsaved, and the retry still sends a null savedOn", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValueOnce(
            failure(WorkflowErrorCode.NotFound, { id: "workflow-1" }, "Gone.")
        );
        await presenter.save();
        useCases.storeWorkflow.mockRejectedValueOnce(new Error("Failed to fetch"));

        await presenter.confirmDialog();

        expect(presenter.vm.saveBanner?.kind).toBe("transport");
        expect(presenter.vm.header).toMatchObject({ dirty: true, canDelete: false });

        useCases.storeWorkflow.mockResolvedValueOnce(
            createEditorWorkflow({ name: "Changed", savedOn: NEW_SAVED_ON })
        );
        await presenter.retrySave();

        expect(useCases.storeWorkflow.mock.calls[2][0].savedOn).toBeNull();
        expect(presenter.vm.header?.dirty).toBe(false);
    });
});

describe("WorkflowEditorPresenter: a Reload that fails (QBZ-18)", () => {
    it("keeps the banner and the dialog, ready again", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(
            failure(
                WorkflowErrorCode.Validation,
                { stepId: null, field: "models", workflowId: "workflow-9" },
                "Taken."
            )
        );
        useCases.getWorkflow.mockResolvedValueOnce(
            createEditorWorkflow({ id: "workflow-9", name: "Article approval" })
        );
        await presenter.save();
        presenter.reloadDuplicate();
        useCases.getWorkflow.mockRejectedValueOnce(new Error("down"));

        await presenter.confirmDialog();

        expect(presenter.vm.dialog).toMatchObject({ kind: "reloadWorkflow", busy: false });
        expect(presenter.vm.saveBanner?.kind).toBe("duplicate");
        expect(presenter.vm.header?.name).toBe("Changed");
    });
});

describe("WorkflowEditorPresenter: a reload or a discard closes the drawer (R284)", () => {
    it("closes the open step and clears the scroll request on the conflict Reload", async () => {
        const { presenter, useCases } = await dirtySetup();
        presenter.openStep("step-1");
        useCases.storeWorkflow.mockRejectedValue(
            failure(
                WorkflowErrorCode.Validation,
                { stepId: "step-1", field: "title", workflowId: null },
                "Bad."
            )
        );
        await presenter.save();
        expect(presenter.vm.scrollRequest).not.toBeNull();
        useCases.storeWorkflow.mockRejectedValue(failure(WorkflowErrorCode.Conflict, null, "x"));
        await presenter.save();

        await presenter.confirmDialog();

        expect(presenter.vm.openStepId).toBeNull();
        expect(presenter.vm.scrollRequest).toBeNull();
        expect(presenter.vm.dialog).toBeNull();
    });

    it("closes the open step when the deleted dialog's Discard closes the draft", async () => {
        const { presenter, useCases } = await dirtySetup();
        presenter.openStep("step-1");
        useCases.storeWorkflow.mockRejectedValue(
            failure(WorkflowErrorCode.NotFound, { id: "workflow-1" }, "Gone.")
        );
        await presenter.save();

        presenter.cancelDialog();

        expect(presenter.vm.openStepId).toBeNull();
    });
});

describe("WorkflowEditorPresenter: a busy dialog (Review Focus 1)", () => {
    it("runs the conflict Reload once for two clicks and ignores Keep editing meanwhile", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(failure(WorkflowErrorCode.Conflict, null, "x"));
        await presenter.save();
        const pending = createDeferred<EditorWorkflow>();
        useCases.getWorkflow.mockClear();
        useCases.getWorkflow.mockReturnValue(pending.promise);

        const first = presenter.confirmDialog();
        await presenter.confirmDialog();
        presenter.cancelDialog();

        expect(useCases.getWorkflow).toHaveBeenCalledTimes(1);
        expect(presenter.vm.dialog).toMatchObject({ kind: "conflict", busy: true });

        pending.resolve(createEditorWorkflow({ name: "Their version", savedOn: NEW_SAVED_ON }));
        await first;

        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header?.name).toBe("Their version");
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.delete.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPage } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelRow } from "~/editor/testing/editorFixtures.js";

const blockingReview = (id: string) => {
    return {
        reviewId: id,
        model: "cms.article",
        targetId: `target-${id}`,
        targetRevisionId: `target-${id}#0001`,
        title: `Title ${id}`,
        stepPosition: 2,
        stepCount: 3,
        stepName: "Legal sign-off"
    };
};

describe("WorkflowEditorPresenter: delete (R278, QBZ-19)", () => {
    it("asks first, naming the workflow and the model", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        await presenter.init(params);

        presenter.requestDelete();

        expect(presenter.vm.dialog).toMatchObject({
            kind: "deleteWorkflow",
            title: "Delete workflow?",
            body: "“Article review” will be removed from Article. New revisions can then be published without a review. Finished reviews keep their history.",
            confirmLabel: "Delete workflow",
            cancelLabel: "Cancel",
            destructive: true
        });
        presenter.cancelDialog();
        expect(presenter.vm.dialog).toBeNull();
        expect(useCases.deleteWorkflow).not.toHaveBeenCalled();
    });

    it("has nothing to delete for a new unsaved draft", async () => {
        const setup = createEditorPresenterSetup();
        setup.useCases.listModels.mockResolvedValue(
            createWorkflowModelPage({ rows: [createWorkflowModelRow({ workflow: null })] })
        );
        await setup.presenter.init(setup.params);
        setup.presenter.createWorkflow();

        setup.presenter.requestDelete();

        expect(setup.presenter.vm.dialog).toBeNull();
    });

    it("deletes on confirm: closes the draft, unbinds the row, clears the review cache and toasts", async () => {
        const { presenter, params, useCases, reviewUseCases, toasts } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.requestDelete();

        await presenter.confirmDialog();

        expect(useCases.deleteWorkflow).toHaveBeenCalledWith("workflow-1");
        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header).toBeNull();
        expect(presenter.vm.empty?.title).toBe("Article has no workflow");
        expect(presenter.vm.panel.rows[0]).toMatchObject({ bound: false, subLine: "No workflow" });
        expect(reviewUseCases.invalidateWorkflows).toHaveBeenCalledTimes(1);
        expect(toasts.success).toHaveBeenCalledWith("Workflow deleted");
    });

    it("shows the dialog busy while the delete runs", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        await presenter.init(params);
        const pending = createDeferred<EditorWorkflow>();
        useCases.deleteWorkflow.mockReturnValue(pending.promise);
        presenter.requestDelete();

        const running = presenter.confirmDialog();

        expect(presenter.vm.dialog?.busy).toBe(true);
        pending.resolve(createEditorWorkflow());
        await running;
        expect(presenter.vm.dialog).toBeNull();
    });

    it("explains why a workflow with running reviews cannot be deleted (singular, with reassign)", async () => {
        const { presenter, params, useCases, app, reviewUseCases, toasts } = createEditorPresenterSetup({
            reassign: true
        });
        await presenter.init(params);
        useCases.deleteWorkflow.mockRejectedValue(
            new GraphQLOperationError({
                code: WorkflowErrorCode.HasActiveReviews,
                message: "Has reviews.",
                data: { count: 1, reviews: [blockingReview("r1")] }
            })
        );
        presenter.requestDelete();

        await presenter.confirmDialog();

        expect(presenter.vm.dialog).toEqual({
            kind: "blockedDelete",
            title: "This workflow can't be deleted yet",
            body: "1 review using “Article review” is in progress.",
            note: "Wait for them to finish, or open each one and cancel it. Then try again.",
            reviews: [
                {
                    reviewId: "r1",
                    title: "Title r1",
                    position: "Step 2 of 3 · Legal sign-off",
                    url: "/content/target-r1/target-r1#0001"
                }
            ],
            confirmLabel: null,
            cancelLabel: "Close",
            destructive: false,
            cancelDestructive: false,
            busy: false
        });
        expect(app.contentAdapter.getContentUrl).toHaveBeenCalledWith({
            namespace: "cms.article",
            targetId: "target-r1",
            targetRevisionId: "target-r1#0001",
            contentTypeId: null
        });
        expect(reviewUseCases.invalidateWorkflows).not.toHaveBeenCalled();
        expect(toasts.success).not.toHaveBeenCalled();

        presenter.cancelDialog();
        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header?.name).toBe("Article review");
    });

    it("counts in the plural, lists at most five reviews and sends a viewer without reassign elsewhere", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        await presenter.init(params);
        const reviews = ["r1", "r2", "r3", "r4", "r5", "r6"].map(blockingReview);
        useCases.deleteWorkflow.mockRejectedValue(
            new GraphQLOperationError({
                code: WorkflowErrorCode.HasActiveReviews,
                message: "Has reviews.",
                data: { count: 9, reviews }
            })
        );
        presenter.requestDelete();

        await presenter.confirmDialog();

        expect(presenter.vm.dialog?.body).toBe("9 reviews using “Article review” are in progress.");
        expect(presenter.vm.dialog?.reviews).toHaveLength(5);
        expect(presenter.vm.dialog?.note).toBe(
            "Wait for them to finish, or ask someone with Reassign and operate to cancel them. Then try again."
        );
    });

    it("treats a workflow that is already gone as deleted", async () => {
        const { presenter, params, useCases, reviewUseCases } = createEditorPresenterSetup();
        await presenter.init(params);
        useCases.deleteWorkflow.mockRejectedValue(
            new GraphQLOperationError({
                code: WorkflowErrorCode.NotFound,
                message: "Not found.",
                data: { id: "workflow-1" }
            })
        );
        presenter.requestDelete();

        await presenter.confirmDialog();

        expect(presenter.vm.header).toBeNull();
        expect(reviewUseCases.invalidateWorkflows).toHaveBeenCalledTimes(1);
    });

    it("closes the dialog and toasts the server message for any other server error", async () => {
        const { presenter, params, useCases, toasts } = createEditorPresenterSetup();
        await presenter.init(params);
        useCases.deleteWorkflow.mockRejectedValue(
            new GraphQLOperationError({
                code: WorkflowErrorCode.Persistence,
                message: "Disk full.",
                data: null
            })
        );
        presenter.requestDelete();

        await presenter.confirmDialog();

        expect(toasts.error).toHaveBeenCalledWith("Disk full.");
        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header?.name).toBe("Article review");
    });

    it("toasts that nothing was changed when the server did not respond", async () => {
        const { presenter, params, useCases, toasts } = createEditorPresenterSetup();
        await presenter.init(params);
        useCases.deleteWorkflow.mockRejectedValue(new Error("Failed to fetch"));
        presenter.requestDelete();

        await presenter.confirmDialog();

        expect(toasts.error).toHaveBeenCalledWith(
            "The server did not respond, so nothing was changed. Try again."
        );
        expect(presenter.vm.header?.name).toBe("Article review");
    });
});

describe("WorkflowEditorPresenter: delete edge cases (R278, QBZ-19)", () => {
    it("deletes once for two clicks and ignores Cancel while the delete runs", async () => {
        const { presenter, params, useCases, toasts, reviewUseCases } = createEditorPresenterSetup();
        await presenter.init(params);
        const pending = createDeferred<EditorWorkflow>();
        useCases.deleteWorkflow.mockReturnValue(pending.promise);
        presenter.requestDelete();

        const first = presenter.confirmDialog();
        await presenter.confirmDialog();
        presenter.cancelDialog();

        expect(useCases.deleteWorkflow).toHaveBeenCalledTimes(1);
        expect(presenter.vm.dialog?.busy).toBe(true);

        pending.resolve(createEditorWorkflow());
        await first;

        expect(toasts.success).toHaveBeenCalledTimes(1);
        expect(reviewUseCases.invalidateWorkflows).toHaveBeenCalledTimes(1);
        expect(presenter.vm.dialog).toBeNull();
    });

    it("still explains a block when the server lists no readable review", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        await presenter.init(params);
        useCases.deleteWorkflow.mockRejectedValue(
            new GraphQLOperationError({
                code: WorkflowErrorCode.HasActiveReviews,
                message: "Has reviews.",
                data: { count: 3, reviews: [] }
            })
        );
        presenter.requestDelete();

        await presenter.confirmDialog();

        expect(presenter.vm.dialog?.body).toBe("3 reviews using “Article review” are in progress.");
        expect(presenter.vm.dialog?.reviews).toEqual([]);
        expect(presenter.vm.dialog?.note).not.toBeNull();
        expect(presenter.vm.dialog?.confirmLabel).toBeNull();
    });

    it("clears the review cache even when the editor was disposed while the delete ran", async () => {
        const { presenter, params, useCases, reviewUseCases, toasts } = createEditorPresenterSetup();
        await presenter.init(params);
        const pending = createDeferred<EditorWorkflow>();
        useCases.deleteWorkflow.mockReturnValue(pending.promise);
        presenter.requestDelete();

        const deleting = presenter.confirmDialog();
        presenter.dispose();
        pending.resolve(createEditorWorkflow());
        await deleting;

        expect(reviewUseCases.invalidateWorkflows).toHaveBeenCalledTimes(1);
        expect(toasts.success).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/mapSaveError.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/readBlockedDeleteData.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/duplicateBannerMessage.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/dialogs/saveDialogs.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.save.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.saveFailures.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.delete.test.ts 2>&1 | tail -40
```

Expected: the first four fail with `Failed to resolve import "./mapSaveError.js"` (and the like for the other modules); the three presenter files load but fail every case with `presenter.save is not a function`, `presenter.requestDelete is not a function` or `presenter.reloadDuplicate is not a function`, and `presenter.vm.saveBanner` is undefined. Record the RED.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/editor/mapSaveError.ts`:

```ts
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { isRecord } from "~/editor/model/isRecord.js";

export interface ValidationFailure {
    kind: "validation";
    message: string;
    stepId: string | null;
    field: string | null;
    workflowId: string | null;
}

export interface ConflictFailure {
    kind: "conflict";
    savedByName: string;
}

export interface NotFoundFailure {
    kind: "notFound";
}

// Any other error the server answered with: only its message is shown.
export interface ServerFailure {
    kind: "server";
    message: string;
}

// The request did not get an answer: a plain `Error` from the transport.
export interface TransportFailure {
    kind: "transport";
}

export type SaveFailure =
    | ValidationFailure
    | ConflictFailure
    | NotFoundFailure
    | ServerFailure
    | TransportFailure;

const FALLBACK_SAVED_BY = "Someone";

function readString(source: Record<string, unknown>, key: string): string | null {
    const value = source[key];
    return typeof value === "string" && value !== "" ? value : null;
}

function mapValidation(error: GraphQLOperationError): ValidationFailure {
    const data = isRecord(error.data) ? error.data : {};

    return {
        kind: "validation",
        message: error.message,
        stepId: readString(data, "stepId"),
        field: readString(data, "field"),
        workflowId: readString(data, "workflowId")
    };
}

function mapConflict(error: GraphQLOperationError): ConflictFailure {
    const data = isRecord(error.data) ? error.data : {};
    const savedBy = isRecord(data.savedBy) ? data.savedBy : {};
    const name = readString(savedBy, "displayName");

    return { kind: "conflict", savedByName: name ?? FALLBACK_SAVED_BY };
}

/*
 * Maps what a failed store call threw to what the presenter does about it (R267, R276). The use
 * cases throw `GraphQLOperationError` for a server error (`code` is a `WorkflowErrorCode`, `data`
 * is the server's data) and let a transport `Error` pass (R204).
 */
export const mapSaveError = (error: unknown): SaveFailure => {
    if (!(error instanceof GraphQLOperationError)) {
        return { kind: "transport" };
    }
    if (error.code === WorkflowErrorCode.Validation) {
        return mapValidation(error);
    }
    if (error.code === WorkflowErrorCode.Conflict) {
        return mapConflict(error);
    }
    if (error.code === WorkflowErrorCode.NotFound) {
        return { kind: "notFound" };
    }
    return { kind: "server", message: error.message };
};
```

Create `packages/app-workflows/src/editor/presentation/editor/readBlockedDeleteData.ts`:

```ts
import { isRecord } from "~/editor/model/isRecord.js";
import type { BlockingReview } from "~/review/domain/types.js";

export interface BlockedDeleteData {
    count: number;
    reviews: BlockingReview[];
}

function readReview(value: unknown): BlockingReview | null {
    if (!isRecord(value)) {
        return null;
    }
    const { reviewId, model, targetId, targetRevisionId, title, stepPosition, stepCount, stepName } =
        value;
    if (
        typeof reviewId !== "string" ||
        typeof model !== "string" ||
        typeof targetId !== "string" ||
        typeof targetRevisionId !== "string" ||
        typeof title !== "string" ||
        typeof stepPosition !== "number" ||
        typeof stepCount !== "number" ||
        typeof stepName !== "string"
    ) {
        return null;
    }
    return { reviewId, model, targetId, targetRevisionId, title, stepPosition, stepCount, stepName };
}

/*
 * The data of a `Workflows/Workflow/HasActiveReviews` error: the exact count and up to five
 * readable reviews (R278). Reads defensively; an entry that is not a review is skipped, and a
 * missing count falls back to the number of reviews.
 */
export const readBlockedDeleteData = (data: unknown): BlockedDeleteData => {
    if (!isRecord(data)) {
        return { count: 0, reviews: [] };
    }
    const entries = Array.isArray(data.reviews) ? data.reviews : [];
    const reviews: BlockingReview[] = [];
    for (const entry of entries) {
        const review = readReview(entry);
        if (review !== null) {
            reviews.push(review);
        }
    }
    const count = typeof data.count === "number" ? data.count : reviews.length;

    return { count, reviews };
};
```

Create `packages/app-workflows/src/editor/presentation/editor/SaveBannerState.ts`:

```ts
// Plain message: any validation or server error with nothing more to point at.
export interface MessageBannerState {
    kind: "message";
    message: string;
}

export interface DuplicateBannerState {
    kind: "duplicate";
    message: string;
    // The workflow the model already has, opened by Reload.
    workflowId: string;
    workflowName: string;
}

export interface TransportBannerState {
    kind: "transport";
}

// Private state of the presenter behind `vm.saveBanner`.
export type SaveBannerState = MessageBannerState | DuplicateBannerState | TransportBannerState;
```

Create `packages/app-workflows/src/editor/presentation/editor/duplicateBannerMessage.ts`:

```ts
import type { WorkflowEditorAppKind } from "~/editor/model/getStepTypeOptions.js";

// Every save failure banner starts with this (R276, R281).
export const SAVE_FAILURE_PREFIX = "Could not save the workflow — ";

export interface DuplicateBannerParams {
    appKind: WorkflowEditorAppKind;
    modelName: string;
    workflowName: string;
}

// QBZ-44: the Website Builder says pages; the CMS says model.
export const duplicateBannerMessage = (params: DuplicateBannerParams): string => {
    const prefix = SAVE_FAILURE_PREFIX;
    if (params.appKind === "wb") {
        return `${prefix}${params.modelName} already have a workflow: “${params.workflowName}”. ${params.modelName} can have one workflow.`;
    }
    return `${prefix}${params.modelName} already has a workflow: “${params.workflowName}”. A model can have one workflow.`;
};
```

Create `packages/app-workflows/src/editor/presentation/editor/toMessageBanner.ts`:

```ts
import { SAVE_FAILURE_PREFIX } from "./duplicateBannerMessage.js";
import type { SaveBannerState } from "./SaveBannerState.js";

// The plain banner for a failure with nothing more to point at (R276, Q43).
export const toMessageBanner = (message: string): SaveBannerState => {
    return { kind: "message", message: `${SAVE_FAILURE_PREFIX}${message}` };
};
```

Create `packages/app-workflows/src/editor/presentation/editor/dialogs/conflictDialog.ts`:

```ts
import type { WorkflowEditorDialogVm } from "../abstractions.js";

export interface ConflictDialogParams {
    // The display name of whoever saved the newer version, `Someone` when unknown (Q43).
    savedByName: string;
    workflowName: string;
}

// D131: the draft is kept; reloading replaces it.
export const conflictDialog = (params: ConflictDialogParams): WorkflowEditorDialogVm => {
    const name = params.workflowName.trim() === "" ? "this workflow" : params.workflowName;

    return {
        kind: "conflict",
        title: "Someone else changed this workflow",
        body: `${params.savedByName} saved a newer version of “${name}” while you were editing, so your changes were not saved. Reload to get the latest version. Reloading discards your unsaved changes.`,
        note: null,
        reviews: [],
        confirmLabel: "Reload workflow",
        cancelLabel: "Keep editing",
        destructive: false,
        cancelDestructive: false,
        busy: false
    };
};
```

Create `packages/app-workflows/src/editor/presentation/editor/dialogs/deletedDialog.ts`:

```ts
import type { WorkflowEditorDialogVm } from "../abstractions.js";

export interface DeletedDialogParams {
    workflowName: string;
    modelName: string;
}

// QBZ-94 (supersedes D123's text): the primary button saves as new, the secondary discards.
export const deletedDialog = (params: DeletedDialogParams): WorkflowEditorDialogVm => {
    const name = params.workflowName.trim() === "" ? "this workflow" : params.workflowName;

    return {
        kind: "deleted",
        title: "This workflow was deleted",
        body: `“${name}” was deleted while you were editing, so your changes were not saved. Save them as a new workflow for ${params.modelName}, or discard them.`,
        note: null,
        reviews: [],
        confirmLabel: "Save as new workflow",
        cancelLabel: "Discard changes",
        destructive: false,
        cancelDestructive: true,
        busy: false
    };
};
```

Create `packages/app-workflows/src/editor/presentation/editor/dialogs/deleteWorkflowDialog.ts`:

```ts
import type { WorkflowEditorDialogVm } from "../abstractions.js";

export interface DeleteWorkflowDialogParams {
    workflowName: string;
    modelName: string;
}

// QBZ-19.
export const deleteWorkflowDialog = (params: DeleteWorkflowDialogParams): WorkflowEditorDialogVm => {
    return {
        kind: "deleteWorkflow",
        title: "Delete workflow?",
        body: `“${params.workflowName}” will be removed from ${params.modelName}. New revisions can then be published without a review. Finished reviews keep their history.`,
        note: null,
        reviews: [],
        confirmLabel: "Delete workflow",
        cancelLabel: "Cancel",
        destructive: true,
        cancelDestructive: false,
        busy: false
    };
};
```

Create `packages/app-workflows/src/editor/presentation/editor/dialogs/blockedDeleteDialog.ts`:

```ts
import type { DialogReviewVm } from "../abstractions.js";
import type { WorkflowEditorDialogVm } from "../abstractions.js";

export interface BlockedDeleteDialogParams {
    workflowName: string;
    // The exact number of reviews in progress, which may exceed the listed ones.
    count: number;
    reviews: DialogReviewVm[];
    // Whether the viewer has the workflows `reassign` permission (QBZ-19).
    canReassign: boolean;
}

const WITH_REASSIGN = "Wait for them to finish, or open each one and cancel it. Then try again.";
const WITHOUT_REASSIGN =
    "Wait for them to finish, or ask someone with Reassign and operate to cancel them. Then try again.";

// QBZ-19: only Close remains.
export const blockedDeleteDialog = (params: BlockedDeleteDialogParams): WorkflowEditorDialogVm => {
    const body =
        params.count === 1
            ? `1 review using “${params.workflowName}” is in progress.`
            : `${params.count} reviews using “${params.workflowName}” are in progress.`;

    return {
        kind: "blockedDelete",
        title: "This workflow can't be deleted yet",
        body,
        note: params.canReassign ? WITH_REASSIGN : WITHOUT_REASSIGN,
        reviews: params.reviews,
        confirmLabel: null,
        cancelLabel: "Close",
        destructive: false,
        cancelDestructive: false,
        busy: false
    };
};
```

Create `packages/app-workflows/src/editor/presentation/editor/dialogs/reloadWorkflowDialog.ts`:

```ts
import type { WorkflowEditorDialogVm } from "../abstractions.js";

export interface ReloadWorkflowDialogParams {
    modelName: string;
    workflowName: string;
}

// QBZ-18: opened by the duplicate banner's Reload.
export const reloadWorkflowDialog = (params: ReloadWorkflowDialogParams): WorkflowEditorDialogVm => {
    return {
        kind: "reloadWorkflow",
        title: "Reload workflow?",
        body: `Your unsaved draft for ${params.modelName} is lost, and the existing workflow “${params.workflowName}” opens.`,
        note: null,
        reviews: [],
        confirmLabel: "Reload",
        cancelLabel: "Keep editing",
        destructive: true,
        cancelDestructive: false,
        busy: false
    };
};
```

Modify `packages/app-workflows/src/editor/presentation/editor/abstractions.ts`.

1. Replace

```ts
export type WorkflowEditorDialogKind = "discardChanges" | "deleteStep";
```

with

```ts
export type WorkflowEditorDialogKind =
    | "discardChanges"
    | "deleteStep"
    | "conflict"
    | "deleted"
    | "deleteWorkflow"
    | "blockedDelete"
    | "reloadWorkflow";
```

2. Before `export interface IWorkflowEditorViewModel {` add:

```ts
export type SaveBannerKind = "message" | "duplicate" | "transport";

/*
 * The destructive banner under the header after a failed save. `title` is null for a one-line
 * banner. The view shows Reload when `canReload` (it calls `reloadDuplicate`), Try again when
 * `canRetry` (`retrySave`) and a dismiss button when `dismissible` (`dismissBanner`).
 */
export interface SaveBannerVm {
    kind: SaveBannerKind;
    title: string | null;
    message: string;
    canReload: boolean;
    canRetry: boolean;
    dismissible: boolean;
}

```

3. In `IWorkflowEditorViewModel`, after `optionsBanner: OptionsBannerVm | null;` add:

```ts
    saveBanner: SaveBannerVm | null;
```

4. In `IWorkflowEditorPresenter`, after `retryModels(): Promise<void>;` add:

```ts
    // Validates, then stores the draft with the loaded `savedOn` (R276).
    save(): Promise<void>;
    // Try again of the transport banner.
    retrySave(): Promise<void>;
    dismissBanner(): void;
    // Reload of the duplicate banner: asks, then opens the workflow the model already has.
    reloadDuplicate(): void;
    // The `Delete workflow` menu item: asks first (R278).
    requestDelete(): void;
```

Modify `packages/app-workflows/src/editor/presentation/editor/PendingDialog.ts`. Replace

```ts
// Task 10 adds the actions of the save and delete dialogs here.
export type PendingAction = SwitchModelAction | RemoveStepAction;
```

with

```ts
// The conflict dialog's Reload: loads the draft's workflow again.
export interface ReloadAction {
    kind: "reload";
}

// The duplicate banner's Reload dialog: opens the workflow the model already has.
export interface ReloadDuplicateAction {
    kind: "reloadDuplicate";
    workflowId: string;
}

// The deleted dialog's primary button: the same id, a null `savedOn`.
export interface SaveAsNewAction {
    kind: "saveAsNew";
}

export interface DeleteWorkflowAction {
    kind: "deleteWorkflow";
}

// The blocked delete dialog has no primary button; Close is the secondary one.
export interface CloseAction {
    kind: "close";
}

export type PendingAction =
    | SwitchModelAction
    | RemoveStepAction
    | ReloadAction
    | ReloadDuplicateAction
    | SaveAsNewAction
    | DeleteWorkflowAction
    | CloseAction;
```

Modify `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts`. Every hunk is against the file as Task 9 leaves it.

1. Imports. Add these lines to the import block of the file (one per line, any order within the block):

```ts
import { validateWorkflowDraft } from "~/editor/model/validateWorkflowDraft.js";
import type { WorkflowDraftErrors } from "~/editor/model/StepFieldError.js";
import { WorkflowEditorToasts } from "~/editor/toasts/WorkflowEditorToasts.js";
import type { DialogReviewVm } from "./abstractions.js";
import type { SaveBannerVm } from "./abstractions.js";
import { blockedDeleteDialog } from "./dialogs/blockedDeleteDialog.js";
import { conflictDialog } from "./dialogs/conflictDialog.js";
import { deleteWorkflowDialog } from "./dialogs/deleteWorkflowDialog.js";
import { deletedDialog } from "./dialogs/deletedDialog.js";
import { reloadWorkflowDialog } from "./dialogs/reloadWorkflowDialog.js";
import { duplicateBannerMessage } from "./duplicateBannerMessage.js";
import { mapSaveError } from "./mapSaveError.js";
import type { SaveFailure } from "./mapSaveError.js";
import type { ValidationFailure } from "./mapSaveError.js";
import { readBlockedDeleteData } from "./readBlockedDeleteData.js";
import type { SaveBannerState } from "./SaveBannerState.js";
import { toMessageBanner } from "./toMessageBanner.js";
```

2. State. After `    private saving = false;` add:

```ts
    private saveBanner: SaveBannerState | null = null;
```

3. Constructor. Replace

```ts
        private config: WorkflowConfigUseCases.Interface,
        private identityContext: IdentityContext.Interface
    ) {
```

with

```ts
        private config: WorkflowConfigUseCases.Interface,
        private identityContext: IdentityContext.Interface,
        private toasts: WorkflowEditorToasts.Interface
    ) {
```

In the `makeAutoObservable` generic list add `| "toasts"` after `| "identityContext"` and `| "saveBanner"` after `| "scrollRequest"`; in the options object add `toasts: false,` after `identityContext: false,` and `saveBanner: observableRef,` after `scrollRequest: observableRef,`.

4. VM. In `get vm()` after `optionsBanner: this.buildOptionsBanner(),` add `saveBanner: this.buildSaveBanner(),`.

5. Public methods. Add after `retryModels()`:

```ts
    async save(): Promise<void> {
        if (this.saving || !this.draft.isDirty || this.detail !== "workflow") {
            return;
        }
        this.saveBanner = null;
        const errors = validateWorkflowDraft({
            name: this.draft.name,
            steps: this.draft.steps,
            automations: this.automations.items,
            aiEditable: isAiEditable(this.stepTypes.items)
        });
        const invalid =
            errors.name !== null || errors.steps !== null || errors.stepErrors.length > 0;
        this.applyClientErrors(errors);
        if (invalid) {
            const message =
                errors.stepErrors.length > 0
                    ? "Fix the highlighted steps before saving."
                    : "Fix the highlighted fields before saving.";
            this.toasts.error(message);
            return;
        }
        await this.persist(this.draft.savedOn, "Workflow saved");
    }

    async retrySave(): Promise<void> {
        this.toasts.info("Retrying…");
        await this.save();
    }

    dismissBanner(): void {
        this.saveBanner = null;
    }

    reloadDuplicate(): void {
        const banner = this.saveBanner;
        const row = this.selectedRow;
        if (banner === null || banner.kind !== "duplicate" || row === null) {
            return;
        }
        this.pending = {
            vm: reloadWorkflowDialog({ modelName: row.name, workflowName: banner.workflowName }),
            action: { kind: "reloadDuplicate", workflowId: banner.workflowId }
        };
    }

    requestDelete(): void {
        const row = this.selectedRow;
        if (row === null || !this.draft.isOpen || this.draft.isNew) {
            return;
        }
        this.pending = {
            vm: deleteWorkflowDialog({ workflowName: this.draft.name, modelName: row.name }),
            action: { kind: "deleteWorkflow" }
        };
    }
```

6. `confirmDialog` and `cancelDialog`. Replace the body of `confirmDialog` after `const action = pending.action;` (the whole remainder of the method) with:

```ts
        if (action.kind === "switchModel") {
            await this.openModel(action.modelId);
            return;
        }
        if (action.kind === "removeStep") {
            this.applyRemoveStep(action.stepId);
            return;
        }
        if (action.kind === "reload") {
            await this.loadWorkflowInto(this.draft.id, "Loaded the latest version");
            return;
        }
        if (action.kind === "reloadDuplicate") {
            await this.loadWorkflowInto(action.workflowId, null);
            return;
        }
        if (action.kind === "saveAsNew") {
            this.draft.detachBaseline();
            this.pending = null;
            await this.persist(null, "Saved as a new workflow");
            return;
        }
        if (action.kind === "deleteWorkflow") {
            await this.deleteCurrent();
        }
```

and replace `cancelDialog` with:

```ts
    cancelDialog(): void {
        // A busy dialog is mid-action (a reload or a delete): its buttons do nothing.
        if (this.dialogBusy) {
            return;
        }
        const pending = this.pending;
        // The deleted dialog's secondary button discards the draft (QBZ-94). The workflow is gone
        // on the server, so the review UI's cached list is stale too (R277).
        if (pending !== null && pending.action.kind === "saveAsNew") {
            const params = this.params;
            this.applyDiscardedDraft();
            if (params !== null) {
                params.reviewUseCases.invalidateWorkflows();
            }
            return;
        }
        this.pending = null;
    }
```

6b. `selectModel`. Add as the first statement of the method (a model switch while a store call is in flight would drop its answer, I10.1):

```ts
        if (this.saving) {
            return;
        }
```

7. `dispose`. After `this.saving = false;` add `this.saveBanner = null;`.

8. Builders. After `buildOptionsBanner()` add:

```ts
    private buildSaveBanner(): SaveBannerVm | null {
        const banner = this.saveBanner;
        if (banner === null) {
            return null;
        }
        if (banner.kind === "transport") {
            return {
                kind: "transport",
                title: "Could not save the workflow",
                message: "The server did not respond, so nothing was saved. Your changes are kept.",
                canReload: false,
                canRetry: true,
                dismissible: true
            };
        }
        return {
            kind: banner.kind,
            title: null,
            message: banner.message,
            canReload: banner.kind === "duplicate",
            canRetry: false,
            dismissible: false
        };
    }
```

9. In `beginOpen`, after `this.pending = null;` add `this.saveBanner = null;`.

10. Private methods. Add after `clearStepErrors`:

```ts
    private async persist(savedOn: string | null, successTitle: string): Promise<void> {
        const params = this.params;
        if (params === null) {
            return;
        }
        const token = this.beginSave();
        try {
            const workflow = await params.useCases.storeWorkflow({
                data: this.draft.toInput(),
                savedOn
            });
            // The server stored it, so the review UI's cached list is stale whatever the editor
            // shows now (R277, Review Focus 8).
            params.reviewUseCases.invalidateWorkflows();
            if (token !== this.selectToken) {
                return;
            }
            this.applySaved(workflow);
            this.toasts.success(successTitle);
        } catch (error) {
            if (token !== this.selectToken) {
                return;
            }
            const failure = mapSaveError(error);
            await this.handleSaveFailure(failure, token);
        }
    }

    private beginSave(): number {
        this.saving = true;
        this.saveBanner = null;
        this.pending = null;
        return this.selectToken;
    }

    private applySaved(workflow: EditorWorkflow): void {
        this.draft.reset(workflow);
        const row = this.selectedRow;
        if (row !== null) {
            this.bindWorkflow(row.modelId, { id: workflow.id, name: workflow.name });
        }
        this.saving = false;
        this.saveBanner = null;
        this.pending = null;
        this.nameError = null;
        this.stepsError = null;
        this.stepErrors = [];
    }

    private async handleSaveFailure(failure: SaveFailure, token: number): Promise<void> {
        this.saving = false;
        if (failure.kind === "conflict") {
            this.pending = {
                vm: conflictDialog({
                    savedByName: failure.savedByName,
                    workflowName: this.draft.name
                }),
                action: { kind: "reload" }
            };
            return;
        }
        if (failure.kind === "notFound") {
            const row = this.selectedRow;
            this.pending = {
                vm: deletedDialog({
                    workflowName: this.draft.name,
                    modelName: row === null ? "" : row.name
                }),
                action: { kind: "saveAsNew" }
            };
            return;
        }
        if (failure.kind === "transport") {
            this.saveBanner = { kind: "transport" };
            return;
        }
        if (failure.kind === "server") {
            this.saveBanner = toMessageBanner(failure.message);
            return;
        }
        await this.handleValidationFailure(failure, token);
    }

    private async handleValidationFailure(
        failure: ValidationFailure,
        token: number
    ): Promise<void> {
        const stepId = failure.stepId;
        if (stepId !== null && this.draft.steps.some(step => step.id === stepId)) {
            this.applyServerStepError(stepId, failure.field, failure.message);
            this.toasts.error("Could not save. Check the highlighted step.");
            return;
        }
        if (failure.workflowId !== null) {
            const banner = await this.resolveDuplicateBanner(failure, token);
            if (token === this.selectToken) {
                this.saveBanner = banner;
            }
            return;
        }
        if (failure.field === "name") {
            this.nameError = failure.message;
        }
        if (failure.field === "steps") {
            this.stepsError = failure.message;
        }
        this.saveBanner = toMessageBanner(failure.message);
    }

    private async resolveDuplicateBanner(
        failure: ValidationFailure,
        token: number
    ): Promise<SaveBannerState> {
        const params = this.params;
        const row = this.selectedRow;
        const workflowId = failure.workflowId;
        if (params === null || row === null || workflowId === null) {
            return toMessageBanner(failure.message);
        }
        let name: string | null = null;
        try {
            const other = await params.useCases.getWorkflow(workflowId);
            name = other.name;
        } catch {
            // Fall back to the name the model row already carries.
            name = row.workflow === null ? null : row.workflow.name;
        }
        if (name === null || token !== this.selectToken) {
            return toMessageBanner(failure.message);
        }
        const message = duplicateBannerMessage({
            appKind: params.app.appKind,
            modelName: row.name,
            workflowName: name
        });
        return { kind: "duplicate", message, workflowId, workflowName: name };
    }

    private applyClientErrors(errors: WorkflowDraftErrors): void {
        this.nameError = errors.name;
        this.stepsError = errors.steps;
        this.stepErrors = errors.stepErrors;
        if (errors.stepErrors.length > 0) {
            this.requestScroll(errors.stepErrors[0].stepId);
        }
    }

    private applyServerStepError(stepId: string, field: string | null, message: string): void {
        this.nameError = null;
        this.stepsError = null;
        this.stepErrors = [{ stepId, errors: [{ field: field ?? "", message }] }];
        this.requestScroll(stepId);
    }

    private requestScroll(stepId: string): void {
        const nonce = this.scrollRequest === null ? 1 : this.scrollRequest.nonce + 1;
        this.scrollRequest = { stepId, nonce };
    }

    private async loadWorkflowInto(id: string, toastTitle: string | null): Promise<void> {
        const params = this.params;
        if (params === null) {
            return;
        }
        this.dialogBusy = true;
        const token = this.selectToken;
        try {
            const workflow = await params.useCases.getWorkflow(id);
            if (token !== this.selectToken) {
                return;
            }
            this.applyReloaded(workflow);
            if (toastTitle !== null) {
                this.toasts.success(toastTitle);
            }
        } catch {
            // The dialog stays open so the admin can try again or keep editing.
            if (token === this.selectToken) {
                this.dialogBusy = false;
            }
            return;
        }
        await this.resolveTeams();
    }

    private applyReloaded(workflow: EditorWorkflow): void {
        this.draft.reset(workflow);
        this.detail = "workflow";
        const row = this.selectedRow;
        if (row !== null) {
            this.bindWorkflow(row.modelId, { id: workflow.id, name: workflow.name });
        }
        this.clearEditingState();
    }

    private applyDiscardedDraft(): void {
        const row = this.selectedRow;
        this.draft.reset(null);
        if (row !== null) {
            this.bindWorkflow(row.modelId, null);
        }
        this.detail = "empty";
        this.clearEditingState();
    }

    // A reload replaces the steps and a discard closes the draft, so the drawer closes too; a
    // successful save keeps the same step ids and leaves it open (R284).
    private clearEditingState(): void {
        this.pending = null;
        this.dialogBusy = false;
        this.saving = false;
        this.saveBanner = null;
        this.nameError = null;
        this.stepsError = null;
        this.stepErrors = [];
        this.scrollRequest = null;
        this.typePickerIndex = null;
        this.openStepId = null;
    }

    private async deleteCurrent(): Promise<void> {
        const params = this.params;
        if (params === null) {
            return;
        }
        this.dialogBusy = true;
        const token = this.selectToken;
        try {
            await params.useCases.deleteWorkflow(this.draft.id);
            params.reviewUseCases.invalidateWorkflows();
            if (token !== this.selectToken) {
                return;
            }
            this.applyDiscardedDraft();
            this.toasts.success("Workflow deleted");
        } catch (error) {
            if (token !== this.selectToken) {
                return;
            }
            this.handleDeleteFailure(error);
        }
    }

    private handleDeleteFailure(error: unknown): void {
        const params = this.params;
        this.dialogBusy = false;
        if (error instanceof GraphQLOperationError && error.code === WorkflowErrorCode.NotFound) {
            // Already gone: the same outcome as a delete.
            this.applyDiscardedDraft();
            if (params !== null) {
                params.reviewUseCases.invalidateWorkflows();
            }
            this.toasts.success("Workflow deleted");
            return;
        }
        if (
            error instanceof GraphQLOperationError &&
            error.code === WorkflowErrorCode.HasActiveReviews &&
            params !== null
        ) {
            this.showBlockedDelete(error, params);
            return;
        }
        this.pending = null;
        if (error instanceof GraphQLOperationError) {
            this.toasts.error(error.message);
            return;
        }
        this.toasts.error("The server did not respond, so nothing was changed. Try again.");
    }

    private showBlockedDelete(
        error: GraphQLOperationError,
        params: WorkflowEditorInitParams
    ): void {
        const blocked = readBlockedDeleteData(error.data);
        const permissions = getWorkflowsPermissionSet(this.identityContext.getIdentity());
        const reviews: DialogReviewVm[] = blocked.reviews.slice(0, 5).map(review => {
            return {
                reviewId: review.reviewId,
                title: review.title,
                position: `Step ${review.stepPosition} of ${review.stepCount} · ${review.stepName}`,
                url: params.app.contentAdapter.getContentUrl({
                    namespace: review.model,
                    targetId: review.targetId,
                    targetRevisionId: review.targetRevisionId,
                    contentTypeId: null
                })
            };
        });
        this.pending = {
            vm: blockedDeleteDialog({
                workflowName: this.draft.name,
                count: blocked.count,
                reviews,
                canReassign: permissions.reassign
            }),
            action: { kind: "close" }
        };
    }
```

11. Dependencies. Replace

```ts
    dependencies: [WorkflowConfigUseCases, IdentityContext]
```

with

```ts
    dependencies: [WorkflowConfigUseCases, IdentityContext, WorkflowEditorToasts]
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/mapSaveError.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/readBlockedDeleteData.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/duplicateBannerMessage.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/dialogs/saveDialogs.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.save.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.saveFailures.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.delete.test.ts 2>&1 | tail -40
```

Expected: PASS. Notes for the first run: (1) the client-validation case for a required automation setting depends on Task 3's validator and on Task 8's `validateWorkflowDraft`; the label `URL is required.` comes from the fixture schema's `title`. (2) `reviewUseCases.invalidateWorkflows` is the Task 6 mock on `createFakeUseCases`. (3) The "deleted" and "conflict" dialogs name the draft's current name (`Changed` in these tests), not the baseline's.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.init.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.models.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.teams.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.flow.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.teamSearch.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -40
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass, including every Task 9 test (the dialog VM tests there already carry `cancelDestructive`); no TypeScript errors.

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
git commit -m "feat(app-workflows): save and delete workflows in the editor presenter" -m "Save validates on the client, sends the loaded savedOn string unchanged and maps every server failure onto the step and field, a banner or a dialog (conflict, deleted, duplicate model, transport). Delete asks first and explains a blocked delete with the running reviews. A save and a delete clear the review UI's workflow cache." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Banner kinds.** Task 19's contract lists three banners (duplicate, transport failure, options failure); R276 also needs a plain `Could not save the workflow — {server message}` banner for any other validation or server error. `vm.saveBanner.kind` is `message` | `duplicate` | `transport`; Task 19 renders `message` like `duplicate` without Reload. Flagged for the consistency pass.
- **Server errors other than validation, conflict, not found.** R276 names only these; a `Persistence`, `NotAuthorized` or unknown-code error shows the `message` banner with the server text (Q43 item 4), and a plain `Error` is the transport banner.
- **Delete failure copy.** The design has no text for a delete that fails for a reason other than active reviews. This task toasts the server message, and for a transport error the 8a text `The server did not respond, so nothing was changed. Try again.` (QBZ-2, R220). Needs a user decision if a dedicated string is wanted.
- **A failed reload keeps the dialog open** (conflict or duplicate Reload): no design text exists for a reload failure, so nothing new is shown; the admin can retry or choose Keep editing.
- **Duplicate banner without a name.** When neither `getWorkflow(workflowId)` nor the row's bound workflow gives a name, the banner is the generic `message` banner (no Reload), because the Reload dialog's copy needs the workflow's name.
- **Dialog VM:** Task 9's shape gained `cancelDestructive` for the deleted dialog, whose secondary button `Discard changes` is the destructive one in the prototype; the confirm of `reloadWorkflow` is the destructive one (QBZ-18). Task 18 styles buttons from `destructive` and `cancelDestructive`.
- **`scrollRequest` is set here** (client errors and a server step error); the view must scroll the card with the id of `vm.scrollRequest.stepId` when `nonce` changes (R284, see Task 9b's notes). A reload, a discard and opening another model clear it and close the drawer (`openStepId`); a successful save keeps the drawer open.
- **A save blocks the model switch.** `selectModel` does nothing while `saving`, so a store call's answer is never orphaned by a switch (I10.1). The review cache is cleared whenever the server answered a store or a delete successfully, also when the editor was disposed meanwhile (the answer is then dropped without a toast), and when the deleted dialog's Discard runs (the workflow is gone on the server).
- **A busy dialog is inert.** `confirmDialog` and `cancelDialog` return while `dialogBusy`, so a double click runs a delete or a reload once and Keep editing cannot race a reload that is already running.
- **Task 5 names used:** `StoreWorkflowParams`, `WorkflowErrorCode`, `WorkflowEditorToasts`, `EDITOR_SAVED_ON`, `createEditorWorkflow`, the fakes (all Task 5, 5b and 5c). `EditorStep.notificationIds` is why the saved input has `notifications: [{ id }]`.
- Size: large (about a dozen new methods on the presenter and seven test files); it is one gate because save, its failures and delete share one state machine (`saving`, `saveBanner`, `pending`).
