import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { WorkflowHasActiveReviewsErrorData } from "@webiny/api-workflows/domain/workflow/errors.js";
import { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { createUserContext, type UserContextParams } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import {
    createWbWorkflowValues,
    requestPageReview,
    storeWbWorkflow,
    WB_ADMIN_ACTOR
} from "~tests/__helpers/engine.js";
import { ARTICLE_NAMESPACE } from "~tests/__helpers/cmsModel.js";
import {
    EDITOR,
    READER,
    toActor,
    WB_READER,
    WORKFLOWS_EDITOR
} from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import {
    RecordingEventPublisher,
    recordedEvents
} from "~tests/__helpers/RecordingEventPublisher.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    mismatchedTargetRevisions,
    scriptTargetReads,
    targetReads,
    throwingTargetRevisions
} from "~tests/__helpers/ScriptedWbPageTargetReads.js";
import { throwOnWorkflowsPermissions } from "~tests/__helpers/ThrowingWorkflowsPermissions.js";
import { failListWorkflows } from "~tests/__helpers/FailingListWorkflows.js";
import { failGetWorkflow } from "~tests/__helpers/FailingGetWorkflow.js";
import { StoreWebsiteBuilderPageWorkflowUseCase } from "~/features/wrappers/StoreWebsiteBuilderPageWorkflow/index.js";
import { DeleteWebsiteBuilderPageWorkflowUseCase } from "~/features/wrappers/DeleteWebsiteBuilderPageWorkflow/index.js";
import { ListWebsiteBuilderPageWorkflowsUseCase } from "~/features/wrappers/ListWebsiteBuilderPageWorkflows/index.js";
import { GetWebsiteBuilderPageWorkflowUseCase } from "~/features/wrappers/GetWebsiteBuilderPageWorkflow/index.js";

const createEditorContext = () => {
    return createUserContext({ identity: EDITOR, permissions: [WORKFLOWS_EDITOR, ...WB_READER] });
};

/** As `createEditorContext`, recording every published event (R80). */
const createRecordingEditorContext = () => {
    recordedEvents.length = 0;
    return createUserContext({
        identity: EDITOR,
        permissions: [WORKFLOWS_EDITOR, ...WB_READER],
        legacyPlugins: [
            (container: Container) => {
                container.registerDecorator(RecordingEventPublisher);
            }
        ]
    });
};

const createReaderContext = () => {
    return createUserContext({ identity: READER, permissions: WB_READER });
};

/** A context that counts the engine's workflow calls; setup contexts do not. */
const createCountingContext = (params: UserContextParams) => {
    return createUserContext({
        ...params,
        legacyPlugins: [countEngineCalls, ...(params.legacyPlugins ?? [])]
    });
};

const store = (context: CmsContext, workflow = createWbWorkflowValues(), savedOn?: string) => {
    return context.container
        .resolve(StoreWebsiteBuilderPageWorkflowUseCase)
        .execute({ workflow, savedOn });
};

const remove = (context: CmsContext, id: string) => {
    return context.container.resolve(DeleteWebsiteBuilderPageWorkflowUseCase).execute({ id });
};

const list = (context: CmsContext) => {
    return context.container.resolve(ListWebsiteBuilderPageWorkflowsUseCase).execute();
};

const get = (context: CmsContext, id: string) => {
    return context.container.resolve(GetWebsiteBuilderPageWorkflowUseCase).execute({ id });
};

/** A Headless CMS workflow stored through the engine (no wrapper). */
const storeCmsWorkflow = async (context: CmsContext) => {
    return expectOk(
        await context.container.resolve(StoreWorkflowUseCase).execute({
            workflow: {
                ...createWbWorkflowValues(),
                id: "cms-workflow",
                name: "Articles review",
                models: [ARTICLE_NAMESPACE]
            },
            actor: WB_ADMIN_ACTOR
        })
    );
};

describe("WB workflow wrappers", () => {
    beforeEach(() => {
        engineCalls.length = 0;
        targetReads.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
        throwingTargetRevisions.clear();
        mismatchedTargetRevisions.clear();
    });

    it("stores a pages workflow for an editor and passes savedOn through (D131)", async () => {
        const editor = await createEditorContext();

        const created = expectOk(await store(editor));
        const stale = await store(
            editor,
            { ...createWbWorkflowValues(), name: "Changed" },
            "2000-01-01T00:00:00.000Z"
        );
        const updated = await store(
            editor,
            { ...createWbWorkflowValues(), name: "Changed" },
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
            await store(editor, { ...createWbWorkflowValues(), name: "Changed" }, created.savedOn)
        );
        expectOk(await remove(editor, created.id));

        const actors = recordedEvents
            .filter(event => event.eventType.startsWith("Workflows/Workflow/"))
            .map(event => [event.eventType, event.payload.actor]);
        const actor = toActor(EDITOR);
        expect(actors).toEqual([
            ["Workflows/Workflow/BeforeCreate", actor],
            ["Workflows/Workflow/AfterCreate", actor],
            ["Workflows/Workflow/BeforeUpdate", actor],
            ["Workflows/Workflow/AfterUpdate", actor],
            ["Workflows/Workflow/BeforeDelete", actor],
            ["Workflows/Workflow/AfterDelete", actor]
        ]);
    });

    it("refuses to store or delete a workflow without editor, before the engine (R60)", async () => {
        await storeWbWorkflow(await createUserContext());
        const reader = await createCountingContext({ identity: READER, permissions: WB_READER });
        engineCalls.length = 0;

        const stored = await store(reader);
        const deleted = await remove(reader, "wb-workflow");

        expect(stored.error.code).toBe("Workflows/NotAuthorized");
        expect(stored.error.data).toEqual({ action: "manage workflows" });
        expect(deleted.error.code).toBe("Workflows/NotAuthorized");
        expect(engineCalls).toEqual([]);
    });

    it("fails store and delete with a persistence error when the permission check throws (R87)", async () => {
        await storeWbWorkflow(await createUserContext());
        const editor = await createCountingContext({
            identity: EDITOR,
            permissions: [WORKFLOWS_EDITOR, ...WB_READER],
            legacyPlugins: [throwOnWorkflowsPermissions]
        });
        engineCalls.length = 0;

        const stored = await store(editor);
        const deleted = await remove(editor, "wb-workflow");

        expect(stored.error.code).toBe("Workflows/Workflow/Persistence");
        expect(deleted.error.code).toBe("Workflows/Workflow/Persistence");
        expect(engineCalls).toEqual([]);
    });

    it("fails list and get with a persistence error when the engine fails (R87)", async () => {
        await storeWbWorkflow(await createUserContext());
        const failingList = await createUserContext({
            identity: READER,
            permissions: WB_READER,
            legacyPlugins: [failListWorkflows]
        });
        const failingGet = await createUserContext({
            identity: READER,
            permissions: WB_READER,
            legacyPlugins: [failGetWorkflow]
        });

        const listed = await list(failingList);
        const got = await get(failingGet, "wb-workflow");

        expect(listed.error.code).toBe("Workflows/Workflow/Persistence");
        expect(got.error.code).toBe("Workflows/Workflow/Persistence");
    });

    it("returns the lookup failure of the store pre-check, without storing (R87)", async () => {
        const editor = await createCountingContext({
            identity: EDITOR,
            permissions: [WORKFLOWS_EDITOR, ...WB_READER],
            legacyPlugins: [failGetWorkflow]
        });
        engineCalls.length = 0;

        const result = await store(editor);

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
        expect(engineCalls).not.toContain("StoreWorkflow");
        const stored = await get(await createEditorContext(), "wb-workflow");
        expect(stored.error.code).toBe("Workflows/Workflow/NotFound");
    });

    it.each([
        ["store", (context: CmsContext) => store(context)],
        ["delete", (context: CmsContext) => remove(context, "wb-workflow")],
        ["list", (context: CmsContext) => list(context)],
        ["get", (context: CmsContext) => get(context, "wb-workflow")]
    ])("refuses an anonymous identity for %s, before the engine", async (_name, act) => {
        const anonymous = await createCountingContext({ identity: null, permissions: [] });

        const result = await act(anonymous);

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).toEqual([]);
    });

    it("binds Website Builder workflows to pages only (R46)", async () => {
        const editor = await createEditorContext();

        const result = await store(editor, {
            ...createWbWorkflowValues(),
            models: [ARTICLE_NAMESPACE]
        });

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            'A Website Builder workflow can only be bound to pages ("wb.page").'
        );
        expect(result.error.data).toEqual({
            stepId: null,
            field: "models",
            workflowId: null,
            ruleId: null
        });
    });

    it("does not rebind a Headless CMS workflow (R46)", async () => {
        const admin = await createUserContext();
        const cms = await storeCmsWorkflow(admin);
        const editor = await createEditorContext();

        const result = await store(editor, { ...createWbWorkflowValues(), id: "cms-workflow" });

        expect(result.error.code).toBe("Workflows/Workflow/NotFound");
        const stored = expectOk(
            await admin.container.resolve(GetWorkflowUseCase).execute({ id: "cms-workflow" })
        );
        expect(stored).toEqual(cms);
    });

    it("lists and gets Website Builder workflows only", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        await storeCmsWorkflow(admin);
        const reader = await createReaderContext();

        const listed = expectOk(await list(reader));
        const wb = await get(reader, "wb-workflow");
        const cms = await get(reader, "cms-workflow");

        expect(listed.map(workflow => workflow.id)).toEqual(["wb-workflow"]);
        expect(wb.isOk()).toBe(true);
        expect(cms.error.code).toBe("Workflows/Workflow/NotFound");
    });

    it("deletes a pages workflow for an editor and not another app's", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        await storeCmsWorkflow(admin);
        const editor = await createEditorContext();

        const deleted = await remove(editor, "wb-workflow");
        const cms = await remove(editor, "cms-workflow");

        expect(deleted.isOk()).toBe(true);
        expect(cms.error.code).toBe("Workflows/Workflow/NotFound");
        const stored = expectOk(
            await admin.container.resolve(GetWorkflowUseCase).execute({ id: "cms-workflow" })
        );
        expect(stored.models).toEqual([ARTICLE_NAMESPACE]);
    });

    it("lists at most five readable blocking reviews and keeps the exact count (D115)", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        // Locked and readable pages interleaved, so the result does not depend on list order.
        const lockedRevisionIds: string[] = [];
        for (let i = 1; i <= 6; i++) {
            const locked = await createPage(admin, {
                title: `Locked ${i}`,
                folderId: "folder-locked"
            });
            lockedRevisionIds.push(locked.id);
            await requestPageReview(admin, locked);
            await requestPageReview(admin, await createPage(admin, { title: `Open ${i}` }));
        }
        folderLevels.set("folder-locked", new Map([[EDITOR.id, "no-access"]]));
        const editor = await createEditorContext();

        const blocked = await remove(editor, "wb-workflow");

        expect(blocked.error.code).toBe("Workflows/Workflow/HasActiveReviews");
        const data = blocked.error.data as WorkflowHasActiveReviewsErrorData;
        expect(data.count).toBe(12);
        expect(data.reviews).toHaveLength(5);
        expect(
            data.reviews.some(review => lockedRevisionIds.includes(review.targetRevisionId))
        ).toBe(false);
    });

    it("checks at most 50 blocking reviews for readability and keeps the exact count (R76)", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        for (let i = 1; i <= 55; i++) {
            const locked = await createPage(admin, {
                title: `Locked ${i}`,
                folderId: "folder-locked"
            });
            await requestPageReview(admin, locked);
        }
        folderLevels.set("folder-locked", new Map([[EDITOR.id, "no-access"]]));
        const editor = await createUserContext({
            identity: EDITOR,
            permissions: [WORKFLOWS_EDITOR, ...WB_READER],
            legacyPlugins: [scriptTargetReads]
        });

        const blocked = await remove(editor, "wb-workflow");

        const data = blocked.error.data as WorkflowHasActiveReviewsErrorData;
        expect(blocked.error.code).toBe("Workflows/Workflow/HasActiveReviews");
        expect(data.count).toBe(55);
        expect(data.reviews).toEqual([]);
        expect(targetReads).toHaveLength(50);
    }, 120_000);

    it("counts a blocking review whose target read throws as unreadable (R76)", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        const broken = await createPage(admin, { title: "Broken" });
        const open = await createPage(admin, { title: "Open" });
        await requestPageReview(admin, broken);
        await requestPageReview(admin, open);
        throwingTargetRevisions.add(broken.id);
        const editor = await createUserContext({
            identity: EDITOR,
            permissions: [WORKFLOWS_EDITOR, ...WB_READER],
            legacyPlugins: [scriptTargetReads]
        });

        const blocked = await remove(editor, "wb-workflow");

        const data = blocked.error.data as WorkflowHasActiveReviewsErrorData;
        expect(blocked.error.code).toBe("Workflows/Workflow/HasActiveReviews");
        expect(data.count).toBe(2);
        expect(data.reviews.map(review => review.targetRevisionId)).toEqual([open.id]);
        expect(targetReads).toHaveLength(2);
    });

    it("counts a blocking review whose target is another page's revision as unreadable", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        const mismatched = await createPage(admin, { title: "Mismatched" });
        const open = await createPage(admin, { title: "Open" });
        await requestPageReview(admin, mismatched);
        await requestPageReview(admin, open);
        mismatchedTargetRevisions.add(mismatched.id);
        const editor = await createUserContext({
            identity: EDITOR,
            permissions: [WORKFLOWS_EDITOR, ...WB_READER],
            legacyPlugins: [scriptTargetReads]
        });

        const blocked = await remove(editor, "wb-workflow");

        const data = blocked.error.data as WorkflowHasActiveReviewsErrorData;
        expect(blocked.error.code).toBe("Workflows/Workflow/HasActiveReviews");
        expect(data.count).toBe(2);
        expect(data.reviews.map(review => review.targetRevisionId)).toEqual([open.id]);
    });
});
