import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPage } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelRow } from "~/editor/testing/editorFixtures.js";

const ARTICLE = createWorkflowModelRow({
    model: "cms.article",
    modelId: "article",
    name: "Article",
    workflow: { id: "workflow-1", name: "Article review", stepCount: 1 }
});
const PRESS = createWorkflowModelRow({
    model: "cms.press",
    modelId: "press",
    name: "Press",
    workflow: { id: "workflow-2", name: "Press approval", stepCount: 1 }
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

describe("WorkflowEditorPresenter: workflow filter", () => {
    it("starts with All and shows the control for the CMS only", async () => {
        const cms = createEditorPresenterSetup();
        await cms.presenter.init(cms.params);

        expect(cms.presenter.vm.panel.filter).toBe("all");
        expect(cms.presenter.vm.panel.showFilter).toBe(true);
    });

    it("reloads from the first page with hasWorkflow true, false and null", async () => {
        const { presenter, params, listWorkflowModels } = setupWithThreeModels();
        await presenter.init(params);
        listWorkflowModels.execute.mockClear();

        presenter.setWorkflowFilter("with");
        await Promise.resolve();
        presenter.setWorkflowFilter("without");
        await Promise.resolve();
        presenter.setWorkflowFilter("all");
        await Promise.resolve();

        expect(listWorkflowModels.execute.mock.calls.map(call => call[0])).toEqual([
            { app: "cms", search: "", hasWorkflow: true, limit: 20, after: null },
            { app: "cms", search: "", hasWorkflow: false, limit: 20, after: null },
            { app: "cms", search: "", hasWorkflow: null, limit: 20, after: null }
        ]);
        expect(presenter.vm.panel.filter).toBe("all");
    });

    it("does not reload for the filter that is already set", async () => {
        const { presenter, params, listWorkflowModels } = setupWithThreeModels();
        await presenter.init(params);
        listWorkflowModels.execute.mockClear();

        presenter.setWorkflowFilter("all");

        expect(listWorkflowModels.execute).not.toHaveBeenCalled();
    });
});

describe("WorkflowEditorPresenter: row menu", () => {
    it("Create workflow opens the model and starts a new draft for it", async () => {
        const { presenter, params } = setupWithThreeModels();
        await presenter.init(params);

        await presenter.createWorkflowForModel("blog");

        expect(presenter.vm.detail).toBe("workflow");
        expect(presenter.vm.header?.name).toBe("Blog review");
        expect(presenter.getNamespace()).toBe("cms.blog");
    });

    it("Delete workflow opens the model and asks to delete its workflow", async () => {
        const { presenter, params } = setupWithThreeModels();
        await presenter.init(params);

        await presenter.requestDeleteWorkflowForModel("press");

        expect(presenter.vm.dialog).toMatchObject({
            kind: "deleteWorkflow",
            title: "Delete workflow?",
            confirmLabel: "Delete workflow"
        });
        expect(presenter.vm.dialog?.body).toContain("“Press approval” will be removed from Press.");
    });

    it("Delete workflow for the open model asks at once", async () => {
        const { presenter, params, getWorkflow } = setupWithThreeModels();
        await presenter.init(params);
        getWorkflow.execute.mockClear();

        await presenter.requestDeleteWorkflowForModel("article");

        expect(getWorkflow.execute).not.toHaveBeenCalled();
        expect(presenter.vm.dialog?.kind).toBe("deleteWorkflow");
    });

    it("does nothing while a dialog is open", async () => {
        const { presenter, params } = setupWithThreeModels();
        await presenter.init(params);
        presenter.requestDelete();

        await presenter.createWorkflowForModel("blog");

        expect(presenter.vm.dialog?.kind).toBe("deleteWorkflow");
        expect(presenter.getNamespace()).toBe("cms.article");
    });

    it("asks before leaving a dirty draft and opens nothing else yet", async () => {
        const { presenter, params } = setupWithThreeModels();
        await presenter.init(params);
        presenter.setName("Changed");

        await presenter.requestDeleteWorkflowForModel("press");

        expect(presenter.vm.dialog?.kind).not.toBe("deleteWorkflow");
        expect(presenter.vm.dialog).not.toBeNull();
        expect(presenter.getNamespace()).toBe("cms.article");
    });
});
