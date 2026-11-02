import { beforeEach, describe, expect, it } from "vitest";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";
import { expectOk } from "~tests/__helpers/entries.js";
import { createUserContext, type UserContextParams } from "~tests/__helpers/userContext.js";
import { EDITOR, READER } from "~tests/__helpers/identities.js";
import { CMS_READER, WORKFLOWS_EDITOR } from "~tests/__helpers/permissions.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { throwOnListModels } from "~tests/__helpers/ThrowingListModels.js";
import { failListModels } from "~tests/__helpers/FailingListModels.js";
import { PADDING_MODEL_COUNT, padListModels } from "~tests/__helpers/PaddingListModels.js";
import { failListWorkflows } from "~tests/__helpers/FailingListWorkflows.js";
import { throwOnWorkflowsPermissions } from "~tests/__helpers/ThrowingWorkflowsPermissions.js";
import { createExtraModelPlugins } from "~tests/__cms/extraModels.js";
import { ListCmsEntryWorkflowModelsUseCase } from "~/features/wrappers/ListCmsEntryWorkflowModels/index.js";

const EDITOR_PERMISSIONS = [WORKFLOWS_EDITOR, ...CMS_READER];

/** A context with the extra code models; counts the engine's calls. */
const createModelsContext = (params: UserContextParams = {}) => {
    return createUserContext({
        ...params,
        legacyPlugins: [
            ...createExtraModelPlugins(),
            countEngineCalls,
            ...(params.legacyPlugins ?? [])
        ]
    });
};

/** Admin binds "Test Workflow" to "author" and "Books review" to "book". */
const createScenario = async () => {
    const admin = await createModelsContext();
    expectOk(await storeWorkflow(admin));
    expectOk(
        await storeWorkflow(admin, {
            ...createWorkflowValues(["cms.book"]),
            id: "workflow-2",
            name: "Books review"
        })
    );
};

const listModels = (context: CmsContext, input: ListCmsEntryWorkflowModelsUseCase.Input = {}) => {
    return context.container.resolve(ListCmsEntryWorkflowModelsUseCase).execute(input);
};

describe("CMS editor model list wrapper", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    it("lists the bindable models sorted by name with the bound workflow (D116)", async () => {
        await createScenario();
        const editor = await createModelsContext({
            identity: EDITOR,
            permissions: EDITOR_PERMISSIONS
        });

        const page = expectOk(await listModels(editor));

        expect(page.items).toEqual([
            { model: "cms.article", modelId: "article", name: "Article", workflow: null },
            {
                model: "cms.author",
                modelId: "author",
                name: "Author",
                workflow: { id: "workflow-1", name: "Test Workflow", stepCount: 1 }
            },
            {
                model: "cms.book",
                modelId: "book",
                name: "Book",
                workflow: { id: "workflow-2", name: "Books review", stepCount: 1 }
            },
            { model: "cms.termEntry", modelId: "termEntry", name: "Glossary", workflow: null }
        ]);
        expect(page.meta).toEqual({ cursor: null, hasMoreItems: false });
    });

    it("does not list a singleton model, even when a search names it", async () => {
        await createScenario();
        const editor = await createModelsContext({
            identity: EDITOR,
            permissions: EDITOR_PERMISSIONS
        });

        const all = expectOk(await listModels(editor));
        const searched = expectOk(await listModels(editor, { search: "home" }));

        expect(all.items.map(row => row.modelId)).not.toContain("homeSetting");
        expect(searched.items).toEqual([]);
    });

    it("searches the name and the model id, ignoring case", async () => {
        await createScenario();
        const editor = await createModelsContext({
            identity: EDITOR,
            permissions: EDITOR_PERMISSIONS
        });

        const byName = expectOk(await listModels(editor, { search: "AUTH" }));
        const byModelId = expectOk(await listModels(editor, { search: "termentry" }));
        const nothing = expectOk(await listModels(editor, { search: "secret" }));

        expect(byName.items.map(row => row.modelId)).toEqual(["author"]);
        expect(byModelId.items.map(row => row.modelId)).toEqual(["termEntry"]);
        expect(nothing.items).toEqual([]);
    });

    it("pages with the cursor", async () => {
        await createScenario();
        const editor = await createModelsContext({
            identity: EDITOR,
            permissions: EDITOR_PERMISSIONS
        });

        const first = expectOk(await listModels(editor, { limit: 3 }));
        const second = expectOk(await listModels(editor, { limit: 3, after: first.meta.cursor }));

        expect(first.items.map(row => row.modelId)).toEqual(["article", "author", "book"]);
        expect(first.meta.hasMoreItems).toBe(true);
        expect(first.meta.cursor).toEqual(expect.any(String));
        expect(second.items.map(row => row.modelId)).toEqual(["termEntry"]);
        expect(second.meta).toEqual({ cursor: null, hasMoreItems: false });
    });

    it("rejects a cursor it did not issue", async () => {
        await createScenario();
        const editor = await createModelsContext({
            identity: EDITOR,
            permissions: EDITOR_PERMISSIONS
        });

        const garbage = await listModels(editor, { after: "not-a-cursor" });
        const negative = await listModels(editor, {
            after: Buffer.from(JSON.stringify({ offset: -1 })).toString("base64")
        });

        expect(garbage.error.code).toBe("Workflows/Workflow/Validation");
        expect(garbage.error.message).toBe("The model list cursor is not valid.");
        expect(negative.error.code).toBe("Workflows/Workflow/Validation");
    });

    it("returns an empty page for an editor who can read no model", async () => {
        await createScenario();
        const editor = await createModelsContext({
            identity: EDITOR,
            permissions: [WORKFLOWS_EDITOR]
        });

        const page = expectOk(await listModels(editor));

        expect(page).toEqual({ items: [], meta: { cursor: null, hasMoreItems: false } });
    });

    it("refuses a user without editor, before the engine", async () => {
        await createScenario();
        const reader = await createModelsContext({
            identity: READER,
            permissions: CMS_READER,
            legacyPlugins: [throwOnListModels]
        });
        engineCalls.length = 0;

        const result = await listModels(reader);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "manage workflows" });
        expect(engineCalls).toEqual([]);
    });

    it("refuses an anonymous identity, before the engine", async () => {
        await createScenario();
        const anonymous = await createModelsContext({
            identity: null,
            permissions: [],
            legacyPlugins: [throwOnListModels]
        });
        engineCalls.length = 0;

        const result = await listModels(anonymous);

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).toEqual([]);
    });

    it("fails with a persistence error when the permission check, the model list or the workflow list fails (R87)", async () => {
        await createScenario();
        const permissionsThrow = await createModelsContext({
            identity: EDITOR,
            permissions: EDITOR_PERMISSIONS,
            legacyPlugins: [throwOnWorkflowsPermissions]
        });
        const modelsThrow = await createModelsContext({
            identity: EDITOR,
            permissions: EDITOR_PERMISSIONS,
            legacyPlugins: [throwOnListModels]
        });
        const modelsFail = await createModelsContext({
            identity: EDITOR,
            permissions: EDITOR_PERMISSIONS,
            legacyPlugins: [failListModels]
        });
        const workflowsFail = await createModelsContext({
            identity: EDITOR,
            permissions: EDITOR_PERMISSIONS,
            legacyPlugins: [failListWorkflows]
        });

        const permissionsResult = await listModels(permissionsThrow);
        const modelsResult = await listModels(modelsThrow);
        const modelsFailResult = await listModels(modelsFail);
        const workflowsResult = await listModels(workflowsFail);

        expect(permissionsResult.error.code).toBe("Workflows/Workflow/Persistence");
        expect(modelsResult.error.code).toBe("Workflows/Workflow/Persistence");
        expect(modelsFailResult.error.code).toBe("Workflows/Workflow/Persistence");
        expect(workflowsResult.error.code).toBe("Workflows/Workflow/Persistence");
    });

    it("does not list the workflows for an empty page", async () => {
        await createScenario();
        const editor = await createModelsContext({
            identity: EDITOR,
            permissions: EDITOR_PERMISSIONS,
            legacyPlugins: [failListWorkflows]
        });

        const noMatch = expectOk(await listModels(editor, { search: "nothing-matches" }));
        const withMatch = await listModels(editor, { search: "author" });

        expect(noMatch).toEqual({ items: [], meta: { cursor: null, hasMoreItems: false } });
        // The failing workflow list is reached only by a page with rows.
        expect(withMatch.error.code).toBe("Workflows/Workflow/Persistence");
    });

    it("guards the limit: not finite is 20, fractions floor, the range is 1 to 100", async () => {
        await createScenario();
        // 4 real bindable models and 150 padding ones, so a default or a clamp is visible.
        const editor = await createModelsContext({
            identity: EDITOR,
            permissions: EDITOR_PERMISSIONS,
            legacyPlugins: [padListModels]
        });
        const total = 4 + PADDING_MODEL_COUNT;

        const unset = expectOk(await listModels(editor));
        const nan = expectOk(await listModels(editor, { limit: Number.NaN }));
        const infinite = expectOk(await listModels(editor, { limit: Number.POSITIVE_INFINITY }));
        const fraction = expectOk(await listModels(editor, { limit: 2.9 }));
        const zero = expectOk(await listModels(editor, { limit: 0 }));
        const negative = expectOk(await listModels(editor, { limit: -5 }));
        const huge = expectOk(await listModels(editor, { limit: 1000 }));
        const all = expectOk(await listModels(editor, { limit: 100 }));
        const rest = expectOk(await listModels(editor, { limit: 100, after: all.meta.cursor }));

        expect(unset.items).toHaveLength(20);
        expect(nan.items).toHaveLength(20);
        expect(nan.meta.hasMoreItems).toBe(true);
        expect(infinite.items).toHaveLength(20);
        expect(fraction.items).toHaveLength(2);
        expect(zero.items).toHaveLength(1);
        expect(negative.items).toHaveLength(1);
        expect(huge.items).toHaveLength(100);
        expect(huge.meta.hasMoreItems).toBe(true);
        expect(all.items.length + rest.items.length).toBe(total);
        expect(rest.meta.hasMoreItems).toBe(false);
    });
});
