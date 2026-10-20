import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { createEditorStepType } from "~/editor/testing/editorFixtures.js";
import { createStepTypes } from "~/editor/testing/draftFixtures.js";
import { createWorkflowModelPage } from "~/editor/testing/editorFixtures.js";
import { createNotificationTransport } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelRow } from "~/editor/testing/editorFixtures.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";

afterEach(() => {
    vi.useRealTimers();
});

describe("WorkflowEditorPresenter: init (R279, D162)", () => {
    it("shows no access without the editor permission and loads nothing", async () => {
        const { presenter, params, app, useCases, listStepTypes } = createEditorPresenterSetup({
            editor: false
        });

        await presenter.init(params);

        expect(presenter.vm.status).toBe("noAccess");
        expect(app.init).not.toHaveBeenCalled();
        expect(useCases.listModels).not.toHaveBeenCalled();
        expect(listStepTypes.execute).not.toHaveBeenCalled();
    });

    it("is loading until the first page arrives, then ready", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        const page = createDeferred<WorkflowModelPage>();
        useCases.listModels.mockReturnValue(page.promise);

        const pending = presenter.init(params);
        await vi.waitFor(() => expect(useCases.listModels).toHaveBeenCalled());

        expect(presenter.vm.status).toBe("loading");
        expect(presenter.vm.panel.loading).toBe(true);

        page.resolve(createWorkflowModelPage());
        await pending;

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.panel.loading).toBe(false);
        expect(presenter.vm.error).toBeNull();
    });

    it("initialises the app adapter before it lists the models (the icons need the cache)", async () => {
        const { presenter, params, app, useCases } = createEditorPresenterSetup();

        await presenter.init(params);

        const initOrder = app.init.mock.invocationCallOrder[0];
        const listOrder = useCases.listModels.mock.invocationCallOrder[0];
        expect(initOrder).toBeLessThan(listOrder);
    });

    it("lists the first page of 20 with no search and no cursor (R280)", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();

        await presenter.init(params);

        expect(useCases.listModels).toHaveBeenCalledTimes(1);
        expect(useCases.listModels).toHaveBeenCalledWith({ search: "", limit: 20, after: null });
    });

    it("takes the panel label and the search flag from the app adapter", async () => {
        const cms = createEditorPresenterSetup({ appKind: "cms" });
        const wb = createEditorPresenterSetup({ appKind: "wb" });

        await cms.presenter.init(cms.params);
        await wb.presenter.init(wb.params);

        expect(cms.presenter.vm.panel.label).toBe("Content models");
        expect(cms.presenter.vm.panel.showSearch).toBe(true);
        expect(wb.presenter.vm.panel.label).toBe("Website Builder");
        expect(wb.presenter.vm.panel.showSearch).toBe(false);
    });

    it("still opens the editor when the adapter init fails: only the icons are missing", async () => {
        const { presenter, params, app, useCases } = createEditorPresenterSetup();
        app.init.mockRejectedValueOnce(new Error("Models are not available."));

        await presenter.init(params);

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.error).toBeNull();
        expect(useCases.listModels).toHaveBeenCalledTimes(1);
        expect(presenter.vm.header?.name).toBe("Article review");
    });

    it("fails when the first page fails, and retry loads it again", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        useCases.listModels.mockRejectedValueOnce(new Error("The server did not respond."));

        await presenter.init(params);

        expect(presenter.vm.status).toBe("failed");
        expect(presenter.vm.error).toBe("The server did not respond.");

        await presenter.retry();

        expect(presenter.vm.status).toBe("ready");
    });

    it("lists the rows render-ready (R280)", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        useCases.listModels.mockResolvedValue(
            createWorkflowModelPage({
                rows: [
                    createWorkflowModelRow({
                        model: "cms.blog",
                        modelId: "blog",
                        name: "Blog",
                        workflow: null
                    }),
                    createWorkflowModelRow({ model: "cms.press", modelId: "press", name: "Press" })
                ]
            })
        );

        await presenter.init(params);

        expect(presenter.vm.panel.rows.map(row => row.modelId)).toEqual(["blog", "press"]);
        expect(presenter.vm.panel.rows[0]).toMatchObject({
            name: "Blog",
            subLine: "No workflow",
            bound: false
        });
    });

    it("opens the first model on its own: a bound workflow loads into the draft", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();

        await presenter.init(params);

        expect(useCases.getWorkflow).toHaveBeenCalledWith("workflow-1");
        expect(presenter.vm.header).toEqual({
            name: "Article review",
            nameError: null,
            appliesTo: "Applies to Article · Headless CMS model",
            dirty: false,
            saving: false,
            canSave: false,
            canDelete: true
        });
        expect(presenter.vm.empty).toBeNull();
        expect(presenter.vm.detail).toBe("workflow");
        expect(presenter.vm.panel.rows[0]).toMatchObject({ active: true, subLine: "1 step" });
    });

    it("shows the empty state when the first model has no workflow", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        useCases.listModels.mockResolvedValue(
            createWorkflowModelPage({ rows: [createWorkflowModelRow({ workflow: null })] })
        );

        await presenter.init(params);

        expect(useCases.getWorkflow).not.toHaveBeenCalled();
        expect(presenter.vm.header).toBeNull();
        expect(presenter.vm.empty).toEqual({
            title: "Article has no workflow",
            description:
                "Add a workflow to require a review before Article content can be published."
        });
        expect(presenter.vm.detail).toBe("empty");
    });

    it("opens nothing when there is no model", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        useCases.listModels.mockResolvedValue(createWorkflowModelPage({ rows: [] }));

        await presenter.init(params);

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.header).toBeNull();
        expect(presenter.vm.empty).toBeNull();
    });
});

describe("WorkflowEditorPresenter: options (R269, R275, R281, R284)", () => {
    it("loads every list and reports each as ready", async () => {
        const { presenter, params, listAiModels } = createEditorPresenterSetup();

        await presenter.init(params);

        const options = presenter.getOptions();
        expect(options.stepTypes.status).toBe("ready");
        expect(options.stepTypes.items.map(item => item.type)).toEqual([
            "review",
            "ai",
            "automation"
        ]);
        expect(options.automations).toMatchObject({ status: "ready" });
        expect(options.automations.items.map(item => item.id)).toEqual(["send-webhook"]);
        expect(options.transports.items.map(item => item.id)).toEqual(["e-mail"]);
        expect(options.aiModels).toMatchObject({ status: "ready" });
        expect(options.aiModels.items.map(item => item.id)).toEqual(["openai/gpt-4o"]);
        expect(options.aiTools.items.map(item => item.name)).toEqual(["readContent"]);
        expect(listAiModels.execute).toHaveBeenCalledTimes(1);
        expect(presenter.vm.optionsBanner).toBeNull();
    });

    it("reports a list as loading while it is pending", async () => {
        const { presenter, params, listNotificationTransports } = createEditorPresenterSetup();
        const transports = createDeferred<NotificationTransport[]>();
        listNotificationTransports.execute.mockReturnValue(transports.promise);

        const pending = presenter.init(params);
        await vi.waitFor(() => expect(listNotificationTransports.execute).toHaveBeenCalled());

        expect(presenter.getOptions().transports.status).toBe("loading");
        expect(presenter.vm.optionsBanner).toBeNull();

        transports.resolve([createNotificationTransport()]);
        await pending;

        expect(presenter.getOptions().transports.status).toBe("ready");
    });

    it("never asks for AI models or tools when the AI row has no config schema, and calls them ready and empty", async () => {
        const { presenter, params, listStepTypes, listAiModels, listAiTools } =
            createEditorPresenterSetup();
        listStepTypes.execute.mockResolvedValue([
            createEditorStepType({ type: "review", title: "Review" }),
            createEditorStepType({ type: "ai", title: "AI", available: true, configSchema: null })
        ]);

        await presenter.init(params);

        expect(listAiModels.execute).not.toHaveBeenCalled();
        expect(listAiTools.execute).not.toHaveBeenCalled();
        const options = presenter.getOptions();
        expect(options.aiModels).toEqual({ status: "ready", items: [] });
        expect(options.aiTools).toEqual({ status: "ready", items: [] });
        expect(presenter.vm.optionsBanner).toBeNull();
    });

    it("never asks for AI models or tools when the AI step type is unavailable", async () => {
        const { presenter, params, listStepTypes, listAiModels } = createEditorPresenterSetup();
        const stepTypes = createStepTypes().map(item => {
            return item.type === "ai" ? { ...item, available: false } : item;
        });
        listStepTypes.execute.mockResolvedValue(stepTypes);

        await presenter.init(params);

        expect(listAiModels.execute).not.toHaveBeenCalled();
        expect(presenter.getOptions().aiModels.status).toBe("ready");
    });

    it("does not request the AI lists when the step types fail, and shows the banner", async () => {
        const { presenter, params, listStepTypes, listAiModels } = createEditorPresenterSetup();
        listStepTypes.execute.mockRejectedValueOnce(new Error("down"));

        await presenter.init(params);

        expect(listAiModels.execute).not.toHaveBeenCalled();
        expect(presenter.getOptions().stepTypes).toEqual({ status: "failed", items: [] });
        expect(presenter.getOptions().aiModels.status).toBe("ready");
        expect(presenter.vm.optionsBanner).toEqual({ message: "Could not load the step options." });
    });

    it("fails one list alone, keeps the others and shows the banner", async () => {
        const { presenter, params, listNotificationTransports } = createEditorPresenterSetup();
        listNotificationTransports.execute.mockRejectedValueOnce(new Error("down"));

        await presenter.init(params);

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.optionsBanner).toEqual({ message: "Could not load the step options." });
        const options = presenter.getOptions();
        expect(options.transports).toEqual({ status: "failed", items: [] });
        expect(options.automations.status).toBe("ready");
        expect(options.stepTypes.status).toBe("ready");
        expect(options.stepTypes.items).toHaveLength(3);
    });

    it("calls an empty list that loaded ready, not failed, and shows no banner", async () => {
        const { presenter, params, listNotificationTransports } = createEditorPresenterSetup();
        listNotificationTransports.execute.mockResolvedValue([]);

        await presenter.init(params);

        expect(presenter.getOptions().transports).toEqual({ status: "ready", items: [] });
        expect(presenter.vm.optionsBanner).toBeNull();
    });

    it("makes the failed list ready and clears the banner when Try again reloads", async () => {
        const { presenter, params, listNotificationTransports } = createEditorPresenterSetup();
        listNotificationTransports.execute.mockRejectedValueOnce(new Error("down"));
        await presenter.init(params);

        await presenter.retryOptions();

        expect(presenter.vm.optionsBanner).toBeNull();
        expect(presenter.getOptions().transports.status).toBe("ready");
        expect(presenter.getOptions().transports.items).toHaveLength(1);
    });

    it("fails a failed AI list with no items and shows the banner", async () => {
        const { presenter, params, listAiModels } = createEditorPresenterSetup();
        listAiModels.execute.mockRejectedValueOnce(new Error("down"));

        await presenter.init(params);

        const options = presenter.getOptions();
        expect(options.aiModels).toEqual({ status: "failed", items: [] });
        expect(options.aiTools.status).toBe("ready");
        expect(presenter.vm.optionsBanner).not.toBeNull();
    });
});

describe("WorkflowEditorPresenter: dispose", () => {
    it("resets the state and drops a pending response", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        const page = createDeferred<WorkflowModelPage>();
        useCases.listModels.mockReturnValue(page.promise);
        const pending = presenter.init(params);
        await vi.waitFor(() => expect(useCases.listModels).toHaveBeenCalled());

        presenter.dispose();
        page.resolve(createWorkflowModelPage());
        await pending;

        expect(presenter.vm.status).toBe("loading");
        expect(presenter.vm.panel.rows).toEqual([]);
        expect(useCases.getWorkflow).not.toHaveBeenCalled();
    });

    it("drops a pending search timer", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        await presenter.init(params);
        useCases.listModels.mockClear();
        vi.useFakeTimers();

        presenter.setSearch("art");
        presenter.dispose();
        await vi.advanceTimersByTimeAsync(1000);

        expect(useCases.listModels).not.toHaveBeenCalled();
        expect(presenter.vm.panel.search).toBe("");
    });
});
