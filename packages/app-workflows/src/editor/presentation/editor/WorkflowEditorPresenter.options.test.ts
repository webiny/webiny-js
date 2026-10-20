import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { WorkflowUserList } from "~/editor/domain/types.js";
import type { AppFolder } from "~/editor/WorkflowEditorAppAdapter.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createStepTypes } from "~/editor/testing/draftFixtures.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPage } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelRow } from "~/editor/testing/editorFixtures.js";
import { createListedUser } from "~/editor/testing/routingStepFixtures.js";
import { createTestInspection } from "~/editor/testing/routingStepFixtures.js";

afterEach(() => {
    vi.useRealTimers();
});

// Lets every pending promise continuation run (the tests use real timers except where they fake them).
const flush = (): Promise<void> => {
    return new Promise<void>(resolve => setTimeout(resolve, 0));
};

const ADA = createListedUser("user-1", "Ada Lovelace", ["team-1"]);
const GRACE = createListedUser("user-2", "Grace Hopper", ["team-2"]);

const openedSetup = async () => {
    const setup = createEditorPresenterSetup();
    setup.app.listFolders.mockResolvedValue([]);
    setup.useCases.folderExists.mockResolvedValue(true);
    await setup.presenter.init(setup.params);
    setup.listWorkflowUsers.execute.mockClear();
    return setup;
};

describe("WorkflowEditorPresenter: user search (R307)", () => {
    it("runs an empty search at once with the default limit and no team scope", async () => {
        const setup = await openedSetup();
        setup.listWorkflowUsers.execute.mockResolvedValue({ users: [ADA, GRACE], missingIds: [] });

        setup.presenter.searchUsers("");
        await vi.waitFor(() => expect(setup.presenter.getUserOptions().items).toHaveLength(2));

        expect(setup.listWorkflowUsers.execute).toHaveBeenCalledWith({
            search: null,
            ids: null,
            teamIds: null,
            limit: 50
        });
        expect(setup.presenter.getUserOptions().loading).toBe(false);
        expect(setup.presenter.getUserOptions().failed).toBe(false);
    });

    it("debounces a typed search by 250 ms", async () => {
        const setup = await openedSetup();
        vi.useFakeTimers();

        setup.presenter.searchUsers("ad");
        setup.presenter.searchUsers("ada");
        await vi.advanceTimersByTimeAsync(249);
        expect(setup.listWorkflowUsers.execute).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);

        expect(setup.listWorkflowUsers.execute).toHaveBeenCalledTimes(1);
        expect(setup.listWorkflowUsers.execute).toHaveBeenCalledWith({
            search: "ada",
            ids: null,
            teamIds: null,
            limit: 50
        });
    });

    it("drops the answer of an older search", async () => {
        const setup = await openedSetup();
        const slow = createDeferred<WorkflowUserList>();
        setup.listWorkflowUsers.execute.mockReturnValueOnce(slow.promise);
        setup.listWorkflowUsers.execute.mockResolvedValueOnce({ users: [GRACE], missingIds: [] });

        setup.presenter.searchUsers("");
        setup.presenter.retryUsers();
        await vi.waitFor(() => expect(setup.presenter.getUserOptions().items).toEqual([GRACE]));
        slow.resolve({ users: [ADA], missingIds: [] });
        await flush();

        expect(setup.presenter.getUserOptions().items).toEqual([GRACE]);
        expect(setup.presenter.getUserOptions().loading).toBe(false);
    });

    it("keeps the found users as known, so a picked value is never looked up again", async () => {
        const setup = await openedSetup();
        setup.listWorkflowUsers.execute.mockResolvedValue({ users: [ADA], missingIds: [] });

        setup.presenter.searchUsers("");
        await vi.waitFor(() => expect(setup.presenter.getUserOptions().items).toEqual([ADA]));

        expect(setup.presenter.getReferences().users.get("user-1")).toEqual({
            id: "user-1",
            label: "Ada Lovelace",
            state: "found"
        });
        expect(setup.presenter.getReferences().userTeamIds.get("user-1")).toEqual(["team-1"]);
        expect(setup.presenter.getUserOptions().selected).toEqual([ADA]);
    });

    it("reports a failed search and searches again on retry", async () => {
        const setup = await openedSetup();
        setup.listWorkflowUsers.execute.mockRejectedValueOnce(new Error("down"));

        setup.presenter.searchUsers("");
        await vi.waitFor(() => expect(setup.presenter.getUserOptions().failed).toBe(true));
        expect(setup.presenter.getUserOptions().loading).toBe(false);

        setup.listWorkflowUsers.execute.mockResolvedValue({ users: [ADA], missingIds: [] });
        setup.presenter.retryUsers();
        await vi.waitFor(() => expect(setup.presenter.getUserOptions().items).toEqual([ADA]));
        expect(setup.presenter.getUserOptions().failed).toBe(false);
    });
});

describe("WorkflowEditorPresenter: target member search (R286, R307)", () => {
    it("scopes the search to the step's teams and answers per team set, whatever the order", async () => {
        const setup = await openedSetup();
        setup.listWorkflowUsers.execute.mockResolvedValue({ users: [ADA], missingIds: [] });

        setup.presenter.searchTargetMembers(["team-1", "team-2"], "");
        await vi.waitFor(() => {
            expect(setup.presenter.getTargetMemberOptions(["team-1", "team-2"]).items).toEqual([
                ADA
            ]);
        });

        expect(setup.listWorkflowUsers.execute).toHaveBeenCalledWith({
            search: null,
            ids: null,
            teamIds: ["team-1", "team-2"],
            limit: 50
        });
        expect(setup.presenter.getTargetMemberOptions(["team-2", "team-1"]).items).toEqual([ADA]);
        expect(setup.presenter.getTargetMemberOptions(["team-3"]).items).toEqual([]);
        expect(setup.presenter.getTargetMemberOptions(["team-3"]).loading).toBe(false);
    });

    it("passes the typed text after the debounce", async () => {
        const setup = await openedSetup();
        vi.useFakeTimers();

        setup.presenter.searchTargetMembers(["team-1"], "gra");
        await vi.advanceTimersByTimeAsync(250);

        expect(setup.listWorkflowUsers.execute).toHaveBeenCalledWith({
            search: "gra",
            ids: null,
            teamIds: ["team-1"],
            limit: 50
        });
    });

    it("asks nothing for a step without teams", async () => {
        const setup = await openedSetup();

        setup.presenter.searchTargetMembers([], "");

        expect(setup.listWorkflowUsers.execute).not.toHaveBeenCalled();
        expect(setup.presenter.getTargetMemberOptions([]).items).toEqual([]);
        expect(setup.presenter.getTargetMemberOptions([]).loading).toBe(false);
    });

    it("drops the answer of an older member search and keeps the user search apart", async () => {
        const setup = await openedSetup();
        setup.listWorkflowUsers.execute.mockResolvedValueOnce({ users: [GRACE], missingIds: [] });
        setup.presenter.searchUsers("");
        await vi.waitFor(() => expect(setup.presenter.getUserOptions().items).toEqual([GRACE]));
        const slow = createDeferred<WorkflowUserList>();
        setup.listWorkflowUsers.execute.mockReturnValueOnce(slow.promise);
        setup.listWorkflowUsers.execute.mockResolvedValueOnce({ users: [ADA], missingIds: [] });

        setup.presenter.searchTargetMembers(["team-1"], "");
        setup.presenter.retryTargetMembers(["team-1"]);
        await vi.waitFor(() => {
            expect(setup.presenter.getTargetMemberOptions(["team-1"]).items).toEqual([ADA]);
        });
        slow.resolve({ users: [GRACE], missingIds: [] });
        await flush();

        expect(setup.presenter.getTargetMemberOptions(["team-1"]).items).toEqual([ADA]);
        expect(setup.presenter.getUserOptions().items).toEqual([GRACE]);
    });

    it("reports a failed member search", async () => {
        const setup = await openedSetup();
        setup.listWorkflowUsers.execute.mockRejectedValueOnce(new Error("down"));

        setup.presenter.searchTargetMembers(["team-1"], "");

        await vi.waitFor(() => {
            expect(setup.presenter.getTargetMemberOptions(["team-1"]).failed).toBe(true);
        });
    });

    it("makes no member lookup while the review step type is unavailable (teams off, R290)", async () => {
        const setup = createEditorPresenterSetup();
        setup.listStepTypes.execute.mockResolvedValue(
            createStepTypes().map(item => {
                return item.type === "review"
                    ? { ...item, available: false, unavailableReason: "Teams are not enabled." }
                    : item;
            })
        );
        await setup.presenter.init(setup.params);
        setup.listWorkflowUsers.execute.mockClear();

        setup.presenter.searchTargetMembers(["team-1"], "");

        expect(setup.listWorkflowUsers.execute).not.toHaveBeenCalled();
        expect(setup.presenter.getTargetMemberOptions(["team-1"]).items).toEqual([]);
    });
});

describe("WorkflowEditorPresenter: folder options (R292, Q54)", () => {
    it("lists the app's folders once per model and reports loading and failure", async () => {
        const setup = createEditorPresenterSetup();
        setup.useCases.folderExists.mockResolvedValue(true);
        const slow = createDeferred<AppFolder[]>();
        setup.app.listFolders.mockReturnValue(slow.promise);

        const opening = setup.presenter.init(setup.params);
        await vi.waitFor(() => expect(setup.presenter.getFolderOptions().loading).toBe(true));
        slow.resolve([{ id: "f1", path: "/News" }]);
        await opening;
        await vi.waitFor(() => expect(setup.presenter.getFolderOptions().loading).toBe(false));

        expect(setup.presenter.getFolderOptions()).toEqual({
            items: [{ id: "f1", path: "/News" }],
            loading: false,
            failed: false
        });
        expect(setup.app.listFolders).toHaveBeenCalledTimes(1);
        expect(setup.app.listFolders).toHaveBeenCalledWith("article");
    });

    it("shows the options banner when the list fails and loads it again on Try again", async () => {
        const setup = createEditorPresenterSetup();
        setup.useCases.folderExists.mockResolvedValue(true);
        setup.app.listFolders.mockRejectedValueOnce(new Error("down"));

        await setup.presenter.init(setup.params);
        await vi.waitFor(() => expect(setup.presenter.getFolderOptions().failed).toBe(true));

        expect(setup.presenter.vm.optionsBanner).toEqual({
            message: "Could not load the step options."
        });

        setup.app.listFolders.mockResolvedValue([{ id: "f1", path: "/News" }]);
        await setup.presenter.retryOptions();

        expect(setup.presenter.getFolderOptions().items).toEqual([{ id: "f1", path: "/News" }]);
        expect(setup.presenter.getFolderOptions().failed).toBe(false);
        expect(setup.presenter.vm.optionsBanner).toBeNull();
    });

    it("does not load the list for a workflow without People steps until one is added", async () => {
        const setup = createEditorPresenterSetup();
        setup.useCases.getWorkflow.mockResolvedValue(createEditorWorkflow({ steps: [] }));
        setup.app.listFolders.mockResolvedValue([{ id: "f1", path: "/News" }]);

        await setup.presenter.init(setup.params);
        expect(setup.app.listFolders).not.toHaveBeenCalled();

        setup.presenter.addStep(0, "review");
        await vi.waitFor(() => expect(setup.app.listFolders).toHaveBeenCalledTimes(1));
        await vi.waitFor(() => {
            expect(setup.presenter.getFolderOptions().items).toEqual([{ id: "f1", path: "/News" }]);
        });
    });
});

describe("WorkflowEditorPresenter: model id and folder type (R292, R300)", () => {
    it("returns the selected row's bare model id, null before a model is open", async () => {
        const setup = createEditorPresenterSetup();
        setup.app.listFolders.mockResolvedValue([]);
        setup.useCases.folderExists.mockResolvedValue(true);
        expect(setup.presenter.getModelId()).toBeNull();

        await setup.presenter.init(setup.params);

        expect(setup.presenter.getModelId()).toBe("article");
        expect(setup.presenter.getNamespace()).toBe("cms.article");
    });

    it("returns the row's own id for Website Builder, where the gateway ignores it", async () => {
        const setup = createEditorPresenterSetup({ appKind: "wb" });
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
        setup.app.listFolders.mockResolvedValue([]);
        setup.useCases.folderExists.mockResolvedValue(true);

        await setup.presenter.init(setup.params);

        expect(setup.presenter.getModelId()).toBe("page");
    });

    it("asks the adapter for the folder type of the open model", async () => {
        const setup = createEditorPresenterSetup();
        setup.app.listFolders.mockResolvedValue([]);
        setup.useCases.folderExists.mockResolvedValue(true);
        setup.app.getFolderType.mockReturnValue("cms:article");
        await setup.presenter.init(setup.params);

        const type = setup.presenter.getFolderType();

        expect(type).toBe("cms:article");
        expect(setup.app.getFolderType).toHaveBeenCalledWith("article");
    });
});

describe("WorkflowEditorPresenter: inspectRouting (R300)", () => {
    const stepConfig = {
        teams: ["team-1"],
        assignment: { strategy: "none", allowManualPick: false, rules: [] }
    };

    it("adds the model id and passes the answer through", async () => {
        const setup = await openedSetup();
        const inspection = createTestInspection();
        setup.useCases.inspectRouting.mockResolvedValue(inspection);

        const result = await setup.presenter.inspectRouting({
            stepConfig,
            requesterId: "user-1",
            folderId: "f1"
        });

        expect(setup.useCases.inspectRouting).toHaveBeenCalledWith({
            stepConfig,
            requesterId: "user-1",
            folderId: "f1",
            modelId: "article"
        });
        expect(result).toBe(inspection);
    });

    it("lets the use case's error through", async () => {
        const setup = await openedSetup();
        const failure = new GraphQLOperationError({
            message: "Rule needs a target.",
            code: "Workflows/Workflow/Validation",
            data: null
        });
        setup.useCases.inspectRouting.mockRejectedValue(failure);

        await expect(
            setup.presenter.inspectRouting({ stepConfig, requesterId: "user-1", folderId: null })
        ).rejects.toBe(failure);
    });

    it("rejects when the editor is not open", async () => {
        const setup = createEditorPresenterSetup();

        await expect(
            setup.presenter.inspectRouting({ stepConfig, requesterId: "user-1", folderId: null })
        ).rejects.toThrow("The editor is not open.");
        expect(setup.useCases.inspectRouting).not.toHaveBeenCalled();
    });
});
