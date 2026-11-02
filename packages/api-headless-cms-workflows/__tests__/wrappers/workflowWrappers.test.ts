import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { WorkflowHasActiveReviewsErrorData } from "@webiny/api-workflows/domain/workflow/errors.js";
import { createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview } from "~tests/__helpers/engine.js";
import { createUserContext, type UserContextParams } from "~tests/__helpers/userContext.js";
import { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import { EDITOR, READER, toActor } from "~tests/__helpers/identities.js";
import {
    RecordingEventPublisher,
    recordedEvents
} from "~tests/__helpers/RecordingEventPublisher.js";
import { CMS_READER, WORKFLOWS_EDITOR } from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    mismatchedTargetRevisions,
    scriptTargetReads,
    targetBatchReads,
    targetReads,
    throwingTargetRevisions
} from "~tests/__helpers/ScriptedTargetReads.js";
import { repeatListWorkflowsCursor } from "~tests/__helpers/RepeatingCursorListWorkflows.js";
import { throwOnWorkflowsPermissions } from "~tests/__helpers/ThrowingWorkflowsPermissions.js";
import { StoreCmsEntryWorkflowUseCase } from "~/features/wrappers/StoreCmsEntryWorkflow/index.js";
import { DeleteCmsEntryWorkflowUseCase } from "~/features/wrappers/DeleteCmsEntryWorkflow/index.js";
import { ListCmsEntryWorkflowsUseCase } from "~/features/wrappers/ListCmsEntryWorkflows/index.js";
import { GetCmsEntryWorkflowUseCase } from "~/features/wrappers/GetCmsEntryWorkflow/index.js";

/** A workflow editor who can read CMS models (binding needs model read access, R38). */
const createEditorContext = () => {
    return createUserContext({ identity: EDITOR, permissions: [WORKFLOWS_EDITOR, ...CMS_READER] });
};

/** As `createEditorContext`, recording every published event (R80). */
const createRecordingEditorContext = () => {
    recordedEvents.length = 0;
    return createUserContext({
        identity: EDITOR,
        permissions: [WORKFLOWS_EDITOR, ...CMS_READER],
        legacyPlugins: [
            (container: Container) => {
                container.registerDecorator(RecordingEventPublisher);
            }
        ]
    });
};

/** The `actor` of each recorded workflow event, by event type (R58, R80). */
const workflowEventActors = () => {
    return recordedEvents
        .filter(event => event.eventType.startsWith("Workflows/Workflow/"))
        .map(event => [event.eventType, event.payload.actor]);
};

const createReaderContext = () => {
    return createUserContext({ identity: READER, permissions: CMS_READER });
};

const store = (context: CmsContext, workflow = createWorkflowValues(), savedOn?: string) => {
    return context.container.resolve(StoreCmsEntryWorkflowUseCase).execute({ workflow, savedOn });
};

const remove = (context: CmsContext, id: string) => {
    return context.container.resolve(DeleteCmsEntryWorkflowUseCase).execute({ id });
};

/** A Website Builder workflow stored through the engine (no wrapper). */
const storeWbWorkflow = async (context: CmsContext) => {
    return expectOk(
        await storeWorkflow(context, {
            ...createWorkflowValues(["wb.page"]),
            id: "wb-workflow",
            name: "Pages review"
        })
    );
};

/** A context that counts the engine's workflow calls; setup contexts do not. */
const createCountingContext = (params: UserContextParams) => {
    return createUserContext({
        ...params,
        legacyPlugins: [countEngineCalls, ...(params.legacyPlugins ?? [])]
    });
};

const list = (context: CmsContext) => {
    return context.container.resolve(ListCmsEntryWorkflowsUseCase).execute();
};

const get = (context: CmsContext, id: string) => {
    return context.container.resolve(GetCmsEntryWorkflowUseCase).execute({ id });
};

describe("CMS workflow wrappers", () => {
    beforeEach(() => {
        engineCalls.length = 0;
        targetReads.length = 0;
        targetBatchReads.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
        throwingTargetRevisions.clear();
        mismatchedTargetRevisions.clear();
    });

    it("stores a workflow for an editor and passes savedOn through (D131)", async () => {
        const editor = await createEditorContext();

        const created = expectOk(await store(editor));
        const stale = await store(
            editor,
            { ...createWorkflowValues(), name: "Changed" },
            "2000-01-01T00:00:00.000Z"
        );
        const updated = await store(
            editor,
            { ...createWorkflowValues(), name: "Changed" },
            created.savedOn
        );

        expect(created.savedBy.id).toBe(EDITOR.id);
        expect(stale.error.code).toBe("Workflows/Workflow/Conflict");
        expect(updated.isOk()).toBe(true);
    });

    it("passes the caller as the actor of the store and delete events (R58, R80)", async () => {
        const editor = await createRecordingEditorContext();

        const created = expectOk(await store(editor));
        expectOk(
            await store(editor, { ...createWorkflowValues(), name: "Changed" }, created.savedOn)
        );
        expectOk(await remove(editor, created.id));

        const actor = toActor(EDITOR);
        expect(workflowEventActors()).toEqual([
            ["Workflows/Workflow/BeforeCreate", actor],
            ["Workflows/Workflow/AfterCreate", actor],
            ["Workflows/Workflow/BeforeUpdate", actor],
            ["Workflows/Workflow/AfterUpdate", actor],
            ["Workflows/Workflow/BeforeDelete", actor],
            ["Workflows/Workflow/AfterDelete", actor]
        ]);
    });

    it("refuses to store or delete a workflow without editor, before the engine (R60)", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        const reader = await createCountingContext({ identity: READER, permissions: CMS_READER });
        engineCalls.length = 0;

        const stored = await store(reader);
        const deleted = await remove(reader, "workflow-1");

        expect(stored.error.code).toBe("Workflows/NotAuthorized");
        expect(stored.error.data).toEqual({ action: "manage workflows" });
        expect(deleted.error.code).toBe("Workflows/NotAuthorized");
        expect(engineCalls).toEqual([]);
    });

    it("fails store and delete with a persistence error when the permission check throws (R87)", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        const editor = await createCountingContext({
            identity: EDITOR,
            permissions: [WORKFLOWS_EDITOR, ...CMS_READER],
            legacyPlugins: [throwOnWorkflowsPermissions]
        });
        engineCalls.length = 0;

        const stored = await store(editor);
        const deleted = await remove(editor, "workflow-1");

        expect(stored.error.code).toBe("Workflows/Workflow/Persistence");
        expect(deleted.error.code).toBe("Workflows/Workflow/Persistence");
        expect(engineCalls).toEqual([]);
    });

    it.each([
        ["store", (context: CmsContext) => store(context)],
        ["delete", (context: CmsContext) => remove(context, "workflow-1")],
        ["list", (context: CmsContext) => list(context)],
        ["get", (context: CmsContext) => get(context, "workflow-1")]
    ])("refuses an anonymous identity for %s, before the engine", async (_name, act) => {
        const anonymous = await createCountingContext({ identity: null, permissions: [] });

        const result = await act(anonymous);

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).toEqual([]);
    });

    it("binds Headless CMS workflows to Headless CMS models only (R46)", async () => {
        const editor = await createEditorContext();

        const result = await store(editor, createWorkflowValues(["wb.page"]));

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            'A Headless CMS workflow can only be bound to Headless CMS models ("cms.<modelId>").'
        );
        expect(result.error.data).toEqual({
            stepId: null,
            field: "models",
            workflowId: null,
            ruleId: null
        });
    });

    it("does not rebind a Website Builder workflow (R46)", async () => {
        const admin = await createUserContext();
        const wb = await storeWbWorkflow(admin);
        const editor = await createEditorContext();

        const result = await store(editor, { ...createWorkflowValues(), id: "wb-workflow" });

        expect(result.error.code).toBe("Workflows/Workflow/NotFound");
        const stored = expectOk(
            await admin.container.resolve(GetWorkflowUseCase).execute({ id: "wb-workflow" })
        );
        expect(stored).toEqual(wb);
    });

    it("lists and gets Headless CMS workflows only", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        await storeWbWorkflow(admin);
        const reader = await createReaderContext();

        const listed = expectOk(
            await reader.container.resolve(ListCmsEntryWorkflowsUseCase).execute()
        );
        const cms = await reader.container
            .resolve(GetCmsEntryWorkflowUseCase)
            .execute({ id: "workflow-1" });
        const wb = await reader.container
            .resolve(GetCmsEntryWorkflowUseCase)
            .execute({ id: "wb-workflow" });

        expect(listed.map(workflow => workflow.id)).toEqual(["workflow-1"]);
        expect(cms.isOk()).toBe(true);
        expect(wb.error.code).toBe("Workflows/Workflow/NotFound");
    });

    it("stops listing when the engine returns the same cursor twice", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        const reader = await createCountingContext({
            identity: READER,
            permissions: CMS_READER,
            legacyPlugins: [repeatListWorkflowsCursor]
        });
        engineCalls.length = 0;

        const listed = expectOk(await list(reader));

        expect(listed.map(workflow => workflow.id)).toEqual(["workflow-1"]);
        expect(engineCalls).toEqual(["ListWorkflows", "ListWorkflows"]);
    });

    it("deletes a workflow for an editor and not another app's", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        await storeWbWorkflow(admin);
        const editor = await createEditorContext();

        const deleted = await remove(editor, "workflow-1");
        const wb = await remove(editor, "wb-workflow");

        expect(deleted.isOk()).toBe(true);
        expect(wb.error.code).toBe("Workflows/Workflow/NotFound");
        const stored = expectOk(
            await admin.container.resolve(GetWorkflowUseCase).execute({ id: "wb-workflow" })
        );
        expect(stored.models).toEqual(["wb.page"]);
    });

    it("lists at most five readable blocking reviews and keeps the exact count (D115)", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        // Locked and readable entries interleaved, so the result does not depend on list order.
        const lockedRevisionIds: string[] = [];
        for (let i = 1; i <= 6; i++) {
            const locked = await createAuthorEntry(admin, {
                name: `Locked ${i}`,
                folderId: "folder-locked"
            });
            lockedRevisionIds.push(locked.id);
            await requestEntryReview(admin, locked);
            await requestEntryReview(admin, await createAuthorEntry(admin, { name: `Open ${i}` }));
        }
        folderLevels.set("folder-locked", new Map([[EDITOR.id, "no-access"]]));
        const editor = await createEditorContext();

        const blocked = await remove(editor, "workflow-1");

        expect(blocked.error.code).toBe("Workflows/Workflow/HasActiveReviews");
        const data = blocked.error.data as WorkflowHasActiveReviewsErrorData;
        expect(data.count).toBe(12);
        expect(data.reviews).toHaveLength(5);
        expect(
            data.reviews.some(review => lockedRevisionIds.includes(review.targetRevisionId))
        ).toBe(false);
        expect(data.reviews[0].stepName).toBe("Step 1");
    });

    it("checks at most 50 blocking reviews for readability and keeps the exact count (R76)", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        for (let i = 1; i <= 55; i++) {
            const locked = await createAuthorEntry(admin, {
                name: `Locked ${i}`,
                folderId: "folder-locked"
            });
            await requestEntryReview(admin, locked);
        }
        folderLevels.set("folder-locked", new Map([[EDITOR.id, "no-access"]]));
        const editor = await createUserContext({
            identity: EDITOR,
            permissions: [WORKFLOWS_EDITOR, ...CMS_READER],
            legacyPlugins: [scriptTargetReads]
        });

        const blocked = await remove(editor, "workflow-1");

        const data = blocked.error.data as WorkflowHasActiveReviewsErrorData;
        expect(blocked.error.code).toBe("Workflows/Workflow/HasActiveReviews");
        expect(data.count).toBe(55);
        expect(data.reviews).toEqual([]);
        expect(targetReads).toHaveLength(50);
        // One batch read for the 50 checked targets, not one read per review (Q79).
        expect(targetBatchReads).toHaveLength(1);
    }, 120_000);

    it("counts every blocking review as unreadable when the batch target read throws (R76)", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        const broken = await createAuthorEntry(admin, { name: "Broken" });
        const open = await createAuthorEntry(admin, { name: "Open" });
        await requestEntryReview(admin, broken);
        await requestEntryReview(admin, open);
        throwingTargetRevisions.add(broken.id);
        const editor = await createUserContext({
            identity: EDITOR,
            permissions: [WORKFLOWS_EDITOR, ...CMS_READER],
            legacyPlugins: [scriptTargetReads]
        });

        const blocked = await remove(editor, "workflow-1");

        const data = blocked.error.data as WorkflowHasActiveReviewsErrorData;
        expect(blocked.error.code).toBe("Workflows/Workflow/HasActiveReviews");
        expect(data.count).toBe(2);
        // One read for both targets, so one throwing target fails the read of both (fail closed).
        expect(data.reviews).toEqual([]);
        expect(targetBatchReads).toHaveLength(1);
        expect([...targetBatchReads[0]].sort()).toEqual([broken.id, open.id].sort());
        expect(targetReads).toHaveLength(2);
    });

    it("counts a blocking review whose target is another entry's revision as unreadable", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        const mismatched = await createAuthorEntry(admin, { name: "Mismatched" });
        const open = await createAuthorEntry(admin, { name: "Open" });
        await requestEntryReview(admin, mismatched);
        await requestEntryReview(admin, open);
        mismatchedTargetRevisions.add(mismatched.id);
        const editor = await createUserContext({
            identity: EDITOR,
            permissions: [WORKFLOWS_EDITOR, ...CMS_READER],
            legacyPlugins: [scriptTargetReads]
        });

        const blocked = await remove(editor, "workflow-1");

        const data = blocked.error.data as WorkflowHasActiveReviewsErrorData;
        expect(blocked.error.code).toBe("Workflows/Workflow/HasActiveReviews");
        expect(data.count).toBe(2);
        expect(data.reviews.map(review => review.targetRevisionId)).toEqual([open.id]);
    });
});
