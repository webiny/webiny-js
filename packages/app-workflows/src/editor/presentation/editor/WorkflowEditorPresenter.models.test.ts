import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPage } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelRow } from "~/editor/testing/editorFixtures.js";

afterEach(() => {
    vi.useRealTimers();
});

const ARTICLE = createWorkflowModelRow({
    model: "cms.article",
    modelId: "article",
    name: "Article",
    workflow: { id: "workflow-1", name: "Article review" }
});
const PRESS = createWorkflowModelRow({
    model: "cms.press",
    modelId: "press",
    name: "Press",
    workflow: { id: "workflow-2", name: "Press approval" }
});
const BLOG = createWorkflowModelRow({
    model: "cms.blog",
    modelId: "blog",
    name: "Blog",
    workflow: null
});

const setupWithThreeModels = () => {
    const setup = createEditorPresenterSetup();
    setup.listWorkflowModels.execute.mockResolvedValue(
        createWorkflowModelPage({ rows: [ARTICLE, PRESS, BLOG] })
    );
    setup.getWorkflow.execute.mockImplementation(async (params): Promise<EditorWorkflow> => {
        if (params.id === "workflow-2") {
            return createEditorWorkflow({
                id: "workflow-2",
                name: "Press approval",
                models: ["cms.press"]
            });
        }
        return createEditorWorkflow();
    });
    return setup;
};

describe("WorkflowEditorPresenter: search (R280, QBZ-20)", () => {
    it("updates the input at once and searches 250 ms after the last keystroke from the first page", async () => {
        const { presenter, params, listWorkflowModels } = setupWithThreeModels();
        await presenter.init(params);
        listWorkflowModels.execute.mockClear();
        vi.useFakeTimers();

        presenter.setSearch("art");
        presenter.setSearch("arti");

        expect(presenter.vm.panel.search).toBe("arti");
        await vi.advanceTimersByTimeAsync(249);
        expect(listWorkflowModels.execute).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(listWorkflowModels.execute).toHaveBeenCalledTimes(1);
        expect(listWorkflowModels.execute).toHaveBeenCalledWith({
            app: "cms",
            search: "arti",
            limit: 20,
            after: null
        });
    });

    it("replaces the rows with the result of the new search", async () => {
        const { presenter, params, listWorkflowModels } = setupWithThreeModels();
        await presenter.init(params);
        listWorkflowModels.execute.mockResolvedValue(createWorkflowModelPage({ rows: [BLOG] }));
        vi.useFakeTimers();

        presenter.setSearch("blog");
        await vi.advanceTimersByTimeAsync(250);

        expect(presenter.vm.panel.rows.map(row => row.modelId)).toEqual(["blog"]);
    });

    it("says No models match when the search finds nothing", async () => {
        const { presenter, params, listWorkflowModels } = setupWithThreeModels();
        await presenter.init(params);
        listWorkflowModels.execute.mockResolvedValue(createWorkflowModelPage({ rows: [] }));
        vi.useFakeTimers();

        presenter.setSearch("zzz");
        await vi.advanceTimersByTimeAsync(250);

        expect(presenter.vm.panel.rows).toEqual([]);
        expect(presenter.vm.panel.emptyText).toBe("No models match “zzz”.");
    });

    it("has no empty text without a search", async () => {
        const { presenter, params } = setupWithThreeModels();
        await presenter.init(params);

        expect(presenter.vm.panel.emptyText).toBeNull();
    });

    it("drops the answer of an older search", async () => {
        const { presenter, params, listWorkflowModels } = setupWithThreeModels();
        await presenter.init(params);
        const first = createDeferred<ReturnType<typeof createWorkflowModelPage>>();
        listWorkflowModels.execute.mockReturnValueOnce(first.promise);
        listWorkflowModels.execute.mockResolvedValueOnce(createWorkflowModelPage({ rows: [BLOG] }));
        vi.useFakeTimers();

        presenter.setSearch("a");
        await vi.advanceTimersByTimeAsync(250);
        presenter.setSearch("ab");
        await vi.advanceTimersByTimeAsync(250);
        first.resolve(createWorkflowModelPage({ rows: [PRESS] }));
        await vi.advanceTimersByTimeAsync(0);

        expect(presenter.vm.panel.rows.map(row => row.modelId)).toEqual(["blog"]);
    });
});

describe("WorkflowEditorPresenter: load more (R280)", () => {
    it("appends the next page with the cursor while there is more", async () => {
        const { presenter, params, listWorkflowModels } = setupWithThreeModels();
        listWorkflowModels.execute.mockResolvedValueOnce(
            createWorkflowModelPage({ rows: [ARTICLE], cursor: "c1", hasMoreItems: true })
        );
        listWorkflowModels.execute.mockResolvedValueOnce(
            createWorkflowModelPage({ rows: [PRESS] })
        );
        await presenter.init(params);
        expect(presenter.vm.panel.hasMore).toBe(true);

        await presenter.loadMore();

        expect(listWorkflowModels.execute).toHaveBeenLastCalledWith({
            app: "cms",
            search: "",
            limit: 20,
            after: "c1"
        });
        expect(presenter.vm.panel.rows.map(row => row.modelId)).toEqual(["article", "press"]);
        expect(presenter.vm.panel.hasMore).toBe(false);
        expect(presenter.vm.panel.loadingMore).toBe(false);
    });

    it("restarts at the first page after a load more and replaces the rows", async () => {
        const { presenter, params, listWorkflowModels } = setupWithThreeModels();
        listWorkflowModels.execute.mockResolvedValueOnce(
            createWorkflowModelPage({ rows: [ARTICLE], cursor: "c1", hasMoreItems: true })
        );
        await presenter.init(params);
        listWorkflowModels.execute.mockResolvedValueOnce(
            createWorkflowModelPage({ rows: [PRESS] })
        );
        await presenter.loadMore();
        listWorkflowModels.execute.mockResolvedValueOnce(createWorkflowModelPage({ rows: [BLOG] }));
        vi.useFakeTimers();

        presenter.setSearch("x");
        await vi.advanceTimersByTimeAsync(250);

        expect(listWorkflowModels.execute).toHaveBeenLastCalledWith({
            app: "cms",
            search: "x",
            limit: 20,
            after: null
        });
        expect(presenter.vm.panel.rows.map(row => row.modelId)).toEqual(["blog"]);
    });

    it("drops a load more answer that arrives after a new search", async () => {
        const { presenter, params, listWorkflowModels } = setupWithThreeModels();
        listWorkflowModels.execute.mockResolvedValueOnce(
            createWorkflowModelPage({ rows: [ARTICLE], cursor: "c1", hasMoreItems: true })
        );
        await presenter.init(params);
        const nextPage = createDeferred<ReturnType<typeof createWorkflowModelPage>>();
        listWorkflowModels.execute.mockReturnValueOnce(nextPage.promise);
        const loading = presenter.loadMore();
        listWorkflowModels.execute.mockResolvedValueOnce(createWorkflowModelPage({ rows: [BLOG] }));
        vi.useFakeTimers();

        presenter.setSearch("x");
        await vi.advanceTimersByTimeAsync(250);
        nextPage.resolve(createWorkflowModelPage({ rows: [PRESS] }));
        await loading;

        expect(presenter.vm.panel.rows.map(row => row.modelId)).toEqual(["blog"]);
        expect(presenter.vm.panel.loadingMore).toBe(false);
    });

    it("does nothing without more pages", async () => {
        const { presenter, params, listWorkflowModels } = setupWithThreeModels();
        await presenter.init(params);
        listWorkflowModels.execute.mockClear();

        await presenter.loadMore();

        expect(listWorkflowModels.execute).not.toHaveBeenCalled();
    });

    it("shows a panel error when a page fails and reloads the first page on retry", async () => {
        const { presenter, params, listWorkflowModels } = setupWithThreeModels();
        listWorkflowModels.execute.mockResolvedValueOnce(
            createWorkflowModelPage({ rows: [ARTICLE], cursor: "c1", hasMoreItems: true })
        );
        await presenter.init(params);
        listWorkflowModels.execute.mockRejectedValueOnce(new Error("down"));

        await presenter.loadMore();

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.panel.error).toBe("Could not load workflows");
        expect(presenter.vm.panel.rows.map(row => row.modelId)).toEqual(["article"]);

        listWorkflowModels.execute.mockResolvedValueOnce(
            createWorkflowModelPage({ rows: [ARTICLE, PRESS] })
        );
        await presenter.retryModels();

        expect(presenter.vm.panel.error).toBeNull();
        expect(presenter.vm.panel.rows.map(row => row.modelId)).toEqual(["article", "press"]);
    });
});

describe("WorkflowEditorPresenter: open a model (R279)", () => {
    it("loads the bound workflow of another model when the draft is clean", async () => {
        const { presenter, params, getWorkflow } = setupWithThreeModels();
        await presenter.init(params);

        await presenter.selectModel("press");

        expect(getWorkflow.execute).toHaveBeenLastCalledWith({ app: "cms", id: "workflow-2" });
        expect(presenter.vm.header?.name).toBe("Press approval");
        expect(presenter.vm.header?.appliesTo).toBe("Applies to Press · Headless CMS model");
        expect(presenter.vm.panel.rows.map(row => row.active)).toEqual([false, true, false]);
        expect(presenter.vm.dialog).toBeNull();
    });

    it("shows the empty state for a model without a workflow", async () => {
        const { presenter, params } = setupWithThreeModels();
        await presenter.init(params);

        await presenter.selectModel("blog");

        expect(presenter.vm.header).toBeNull();
        expect(presenter.vm.empty?.title).toBe("Blog has no workflow");
        expect(presenter.vm.flow).toEqual({ steps: [], stepsError: null, modelName: "" });
    });

    it("does nothing for the model that is already open", async () => {
        const { presenter, params, getWorkflow } = setupWithThreeModels();
        await presenter.init(params);
        getWorkflow.execute.mockClear();

        await presenter.selectModel("article");

        expect(getWorkflow.execute).not.toHaveBeenCalled();
    });

    it("asks before leaving a dirty draft and keeps editing on cancel (QBZ-17)", async () => {
        const { presenter, params, getWorkflow } = setupWithThreeModels();
        await presenter.init(params);
        presenter.setName("Changed");
        getWorkflow.execute.mockClear();

        await presenter.selectModel("press");

        expect(presenter.vm.dialog).toEqual({
            kind: "discardChanges",
            icon: "warning",
            title: "Discard unsaved changes?",
            body: "You have unsaved changes to “Changed”. If you leave this workflow now, they are lost.",
            note: null,
            reviews: [],
            confirmLabel: "Discard changes",
            cancelLabel: "Keep editing",
            destructive: true,
            cancelDestructive: false,
            busy: false
        });
        expect(getWorkflow.execute).not.toHaveBeenCalled();

        presenter.cancelDialog();

        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header?.name).toBe("Changed");
        expect(presenter.vm.header?.dirty).toBe(true);
    });

    it("discards the draft and opens the model on confirm", async () => {
        const { presenter, params, getWorkflow } = setupWithThreeModels();
        await presenter.init(params);
        presenter.setName("Changed");
        await presenter.selectModel("press");

        await presenter.confirmDialog();

        expect(getWorkflow.execute).toHaveBeenLastCalledWith({ app: "cms", id: "workflow-2" });
        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header?.name).toBe("Press approval");
        expect(presenter.vm.header?.dirty).toBe(false);
    });

    it("closes the dialog on confirm when a search dropped the pending model's row", async () => {
        const { presenter, params, listWorkflowModels } = setupWithThreeModels();
        await presenter.init(params);
        presenter.setName("Changed");
        await presenter.selectModel("press");
        expect(presenter.vm.dialog).not.toBeNull();
        listWorkflowModels.execute.mockResolvedValue(createWorkflowModelPage({ rows: [BLOG] }));
        vi.useFakeTimers();
        presenter.setSearch("blog");
        await vi.advanceTimersByTimeAsync(250);

        await presenter.confirmDialog();

        expect(presenter.vm.dialog).toBeNull();
    });

    it("asks before leaving a new unsaved draft", async () => {
        const { presenter, params } = setupWithThreeModels();
        await presenter.init(params);
        await presenter.selectModel("blog");
        presenter.createWorkflow();

        await presenter.selectModel("press");

        expect(presenter.vm.dialog?.kind).toBe("discardChanges");
    });

    it("unbinds the row and shows the empty state when the bound workflow was deleted", async () => {
        const { presenter, params, getWorkflow } = setupWithThreeModels();
        await presenter.init(params);
        getWorkflow.execute.mockRejectedValueOnce(
            new GraphQLOperationError({
                message: "Workflow not found.",
                code: WorkflowErrorCode.NotFound,
                data: { id: "workflow-2" }
            })
        );

        await presenter.selectModel("press");

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.empty?.title).toBe("Press has no workflow");
        expect(presenter.vm.panel.rows[1]).toMatchObject({ bound: false, subLine: "No workflow" });
    });

    it("fails the page when the workflow does not load, and retry opens that model again", async () => {
        const { presenter, params, getWorkflow } = setupWithThreeModels();
        await presenter.init(params);
        getWorkflow.execute.mockRejectedValueOnce(new Error("The server did not respond."));

        await presenter.selectModel("press");

        expect(presenter.vm.status).toBe("failed");
        expect(presenter.vm.error).toBe("The server did not respond.");

        await presenter.retry();

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.header?.name).toBe("Press approval");
        expect(presenter.vm.panel.rows.map(row => row.active)).toEqual([false, true, false]);
    });

    it("ignores the answer of a model that is no longer the open one", async () => {
        const { presenter, params, getWorkflow } = setupWithThreeModels();
        await presenter.init(params);
        const slow = createDeferred<EditorWorkflow>();
        getWorkflow.execute.mockReturnValueOnce(slow.promise);

        const pendingPress = presenter.selectModel("press");
        await presenter.selectModel("article");
        slow.resolve(
            createEditorWorkflow({
                id: "workflow-2",
                name: "Press approval",
                models: ["cms.press"]
            })
        );
        await pendingPress;

        expect(presenter.vm.header?.name).toBe("Article review");
        expect(presenter.vm.panel.rows.map(row => row.active)).toEqual([true, false, false]);
    });

    it("shows the open workflow's step count in its row", async () => {
        const { presenter, params } = setupWithThreeModels();
        await presenter.init(params);

        expect(presenter.vm.panel.rows[0].subLine).toBe("1 step");
        expect(presenter.vm.panel.rows[1].subLine).toBe("Press approval");
    });
});
