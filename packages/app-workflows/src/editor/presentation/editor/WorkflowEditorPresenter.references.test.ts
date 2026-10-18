import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { EditorStep } from "~/editor/domain/types.js";
import type { WorkflowTeamSummary } from "~/editor/domain/types.js";
import type { WorkflowUserList } from "~/editor/domain/types.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createStepTypes } from "~/editor/testing/draftFixtures.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import type { EditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPage } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelRow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";
import { createListedUser } from "~/editor/testing/routingStepFixtures.js";
import { createRoutingStep } from "~/editor/testing/routingStepFixtures.js";
import { createStoredRule } from "~/editor/testing/routingStepFixtures.js";

const FOLDER_TYPE = "cms:article";

const withWorkflow = (steps: EditorStep[]): EditorPresenterSetup => {
    const setup = createEditorPresenterSetup();
    setup.useCases.getWorkflow.mockResolvedValue(createEditorWorkflow({ steps }));
    setup.app.listFolders.mockResolvedValue([]);
    setup.useCases.folderExists.mockResolvedValue(true);
    return setup;
};

// `listUsers({ ids })` answers the directory's users and reports the other ids as missing.
const answerUsers = (setup: EditorPresenterSetup, directory: WorkflowUserSummary[]): void => {
    setup.config.listUsers.mockImplementation(async params => {
        const ids = params.ids ?? [];
        const users = directory.filter(user => ids.includes(user.id));
        const missingIds = ids.filter(id => !directory.some(user => user.id === id));
        return { users, missingIds };
    });
};

const answerTeams = (setup: EditorPresenterSetup, directory: WorkflowTeamSummary[]): void => {
    setup.config.listTeams.mockImplementation(async params => {
        const ids = params.ids ?? [];
        const teams = directory.filter(team => ids.includes(team.id));
        const missingIds = ids.filter(id => !directory.some(team => team.id === id));
        return { teams, missingIds };
    });
};

const fullRules = () => {
    return [
        createStoredRule({
            id: "r1",
            requesterUserId: "user-1",
            requesterTeamId: "team-9",
            folder: { id: "f1", type: FOLDER_TYPE, includeDescendants: true },
            target: { type: "user", id: "user-2" }
        }),
        createStoredRule({
            id: "r2",
            folder: { id: "f2", type: FOLDER_TYPE, includeDescendants: false },
            target: { type: "team", id: "team-1" }
        }),
        createStoredRule({
            id: "r3",
            folder: { id: "f3", type: FOLDER_TYPE, includeDescendants: false },
            target: { type: "user", id: "user-3" }
        })
    ];
};

describe("WorkflowEditorPresenter: saved references (R298, D117, Review Focus 4)", () => {
    it("resolves users, rule teams and folders by id after the workflow loads", async () => {
        const setup = withWorkflow([createRoutingStep(fullRules())]);
        answerUsers(setup, [
            createListedUser("user-1", "Ada Lovelace", ["team-1"]),
            createListedUser("user-3", "Grace Hopper", ["team-1"])
        ]);
        answerTeams(setup, [
            createWorkflowTeamSummary({ id: "team-1", name: "Editors" }),
            createWorkflowTeamSummary({ id: "team-9", name: "Marketing" })
        ]);
        setup.app.listFolders.mockResolvedValue([{ id: "f1", path: "/News" }]);
        setup.useCases.folderExists.mockImplementation(async params => params.id === "f2");

        await setup.presenter.init(setup.params);

        const references = setup.presenter.getReferences();
        expect(setup.config.listUsers).toHaveBeenCalledWith({
            search: null,
            ids: ["user-1", "user-2", "user-3"],
            teamIds: null,
            limit: null
        });
        expect(references.users.get("user-1")).toEqual({
            id: "user-1",
            label: "Ada Lovelace",
            state: "found"
        });
        expect(references.userTeamIds.get("user-1")).toEqual(["team-1"]);
        expect(references.users.get("user-2")).toEqual({
            id: "user-2",
            label: "Deleted user",
            state: "deleted"
        });
        expect(references.teams.get("team-9")?.label).toBe("Marketing");
        expect(references.folders.get("f1")).toEqual({
            id: "f1",
            label: "/News",
            state: "found"
        });
        expect(references.folders.get("f2")?.state).toBe("restricted");
        expect(references.folders.get("f3")).toEqual({
            id: "f3",
            label: "Deleted folder",
            state: "deleted"
        });
        expect(setup.presenter.vm.optionsBanner).toBeNull();
    });

    it("looks a rule team up only when the step teams did not already resolve it", async () => {
        const setup = withWorkflow([
            createRoutingStep([
                createStoredRule({ id: "r1", requesterTeamId: "team-9" }),
                createStoredRule({ id: "r2", target: { type: "team", id: "team-1" } })
            ])
        ]);
        answerTeams(setup, [
            createWorkflowTeamSummary({ id: "team-1", name: "Editors" }),
            createWorkflowTeamSummary({ id: "team-9", name: "Marketing" })
        ]);

        await setup.presenter.init(setup.params);

        expect(setup.config.listTeams).toHaveBeenCalledTimes(2);
        expect(setup.config.listTeams).toHaveBeenNthCalledWith(1, {
            search: null,
            ids: ["team-1"],
            limit: null
        });
        expect(setup.config.listTeams).toHaveBeenNthCalledWith(2, {
            search: null,
            ids: ["team-9"],
            limit: null
        });
        expect(setup.presenter.getReferences().teams.get("team-1")?.label).toBe("Editors");
    });

    it("asks the folder list once, with the model id, and folderExists once per distinct unlisted id", async () => {
        const setup = withWorkflow([
            createRoutingStep([
                createStoredRule({
                    id: "r1",
                    folder: { id: "f2", type: FOLDER_TYPE, includeDescendants: false }
                }),
                createStoredRule({
                    id: "r2",
                    folder: { id: "f2", type: FOLDER_TYPE, includeDescendants: true }
                }),
                createStoredRule({
                    id: "r3",
                    folder: { id: "f1", type: FOLDER_TYPE, includeDescendants: false }
                })
            ])
        ]);
        setup.app.listFolders.mockResolvedValue([{ id: "f1", path: "/News" }]);

        await setup.presenter.init(setup.params);

        expect(setup.app.listFolders).toHaveBeenCalledTimes(1);
        expect(setup.app.listFolders).toHaveBeenCalledWith("article");
        expect(setup.useCases.folderExists).toHaveBeenCalledTimes(1);
        expect(setup.useCases.folderExists).toHaveBeenCalledWith({ id: "f2", type: FOLDER_TYPE });
    });

    it("sends a saved folder's own type to folderExists", async () => {
        const setup = withWorkflow([
            createRoutingStep([
                createStoredRule({
                    id: "r1",
                    folder: { id: "f9", type: "cms:other", includeDescendants: false }
                })
            ])
        ]);

        await setup.presenter.init(setup.params);

        expect(setup.useCases.folderExists).toHaveBeenCalledWith({ id: "f9", type: "cms:other" });
    });

    it("asks nothing for a workflow whose rules reference nothing", async () => {
        const setup = withWorkflow([createRoutingStep([])]);

        await setup.presenter.init(setup.params);

        expect(setup.config.listUsers).not.toHaveBeenCalled();
        expect(setup.useCases.folderExists).not.toHaveBeenCalled();
        expect(setup.presenter.getReferences().users.size).toBe(0);
    });

    it("asks 200 user ids per call and merges the answers of concurrent chunks", async () => {
        const rules = Array.from({ length: 450 }, (_, index) => {
            return createStoredRule({
                id: `r${index}`,
                target: { type: "user", id: `user-${index}` }
            });
        });
        const setup = withWorkflow([createRoutingStep(rules)]);
        const directory = Array.from({ length: 450 }, (_, index) => {
            return createListedUser(`user-${index}`, `User ${index}`);
        });
        answerUsers(setup, directory);

        await setup.presenter.init(setup.params);

        const sizes = setup.config.listUsers.mock.calls.map(call => (call[0].ids ?? []).length);
        expect(sizes).toEqual([200, 200, 50]);
        expect(setup.presenter.getReferences().users.size).toBe(450);
    });

    it("shows the options banner when a lookup fails, and retry resolves only the unresolved ids", async () => {
        const rules = Array.from({ length: 250 }, (_, index) => {
            return createStoredRule({
                id: `r${index}`,
                target: { type: "user", id: `user-${index}` }
            });
        });
        const setup = withWorkflow([createRoutingStep(rules)]);
        const directory = Array.from({ length: 250 }, (_, index) => {
            return createListedUser(`user-${index}`, `User ${index}`);
        });
        answerUsers(setup, directory);
        setup.config.listUsers.mockImplementationOnce(async params => {
            const ids = params.ids ?? [];
            return { users: directory.filter(user => ids.includes(user.id)), missingIds: [] };
        });
        setup.config.listUsers.mockImplementationOnce(async () => {
            throw new Error("down");
        });

        await setup.presenter.init(setup.params);

        expect(setup.presenter.vm.optionsBanner).toEqual({
            message: "Could not load the step options."
        });
        expect(setup.presenter.getReferences().users.size).toBe(200);

        setup.config.listUsers.mockClear();
        setup.presenter.retryReferences();
        await vi.waitFor(() => expect(setup.presenter.getReferences().users.size).toBe(250));

        expect(setup.config.listUsers).toHaveBeenCalledTimes(1);
        expect(setup.config.listUsers.mock.calls[0][0].ids).toHaveLength(50);
        expect(setup.presenter.vm.optionsBanner).toBeNull();
    });

    it("reports the resolution status: loading while a lookup runs, failed after one failed", async () => {
        const setup = withWorkflow([
            createRoutingStep([
                createStoredRule({ id: "r1", target: { type: "user", id: "user-1" } })
            ])
        ]);
        const slow = createDeferred<WorkflowUserList>();
        setup.config.listUsers.mockReturnValueOnce(slow.promise);

        const loading = setup.presenter.init(setup.params);
        await vi.waitFor(() => expect(setup.presenter.getReferencesStatus().loading).toBe(true));
        slow.reject(new Error("down"));
        await loading;

        expect(setup.presenter.getReferencesStatus()).toEqual({ loading: false, failed: true });

        answerUsers(setup, [createListedUser("user-1", "Ada Lovelace")]);
        setup.presenter.retryReferences();
        await vi.waitFor(() => {
            expect(setup.presenter.getReferencesStatus()).toEqual({
                loading: false,
                failed: false
            });
        });
    });

    it("ends the loading state and reports a failure when a lookup throws synchronously", async () => {
        const setup = withWorkflow([
            createRoutingStep([
                createStoredRule({ id: "r1", target: { type: "user", id: "user-1" } })
            ])
        ]);
        setup.config.listUsers.mockImplementation(() => {
            throw new Error("sync");
        });

        await setup.presenter.init(setup.params);

        expect(setup.presenter.getReferencesStatus()).toEqual({ loading: false, failed: true });
    });

    it("ends the loading state when the folder existence check throws synchronously", async () => {
        const setup = withWorkflow([
            createRoutingStep([
                createStoredRule({
                    id: "r1",
                    folder: { id: "f1", type: FOLDER_TYPE, includeDescendants: false }
                })
            ])
        ]);
        setup.useCases.folderExists.mockImplementation(() => {
            throw new Error("sync");
        });

        await setup.presenter.init(setup.params);

        expect(setup.presenter.getReferencesStatus()).toEqual({ loading: false, failed: true });
    });

    it("loads the folder list again on Try again after it failed, and shows the banner meanwhile", async () => {
        const setup = withWorkflow([
            createRoutingStep([
                createStoredRule({
                    id: "r1",
                    folder: { id: "f1", type: FOLDER_TYPE, includeDescendants: false }
                })
            ])
        ]);
        setup.app.listFolders.mockRejectedValueOnce(new Error("down"));

        await setup.presenter.init(setup.params);

        expect(setup.presenter.vm.optionsBanner).toEqual({
            message: "Could not load the step options."
        });
        expect(setup.useCases.folderExists).not.toHaveBeenCalled();
        expect(setup.presenter.getReferences().folders.has("f1")).toBe(false);

        setup.app.listFolders.mockResolvedValue([{ id: "f1", path: "/News" }]);
        await setup.presenter.retryOptions();

        expect(setup.presenter.getReferences().folders.get("f1")?.label).toBe("/News");
        expect(setup.presenter.vm.optionsBanner).toBeNull();
    });

    it("does not re-resolve a team that a search already returned", async () => {
        const setup = withWorkflow([createRoutingStep([])]);
        await setup.presenter.init(setup.params);
        setup.config.listTeams.mockResolvedValue({
            teams: [createWorkflowTeamSummary({ id: "team-9", name: "Marketing" })],
            missingIds: []
        });
        setup.presenter.searchTeams("");
        await vi.waitFor(() => {
            expect(setup.presenter.getReferences().teams.get("team-9")?.label).toBe("Marketing");
        });
        setup.config.listTeams.mockClear();

        setup.presenter.updateStep("step-1", {
            config: {
                teams: ["team-1"],
                assignment: {
                    strategy: "none",
                    allowManualPick: false,
                    rules: [createStoredRule({ id: "r1", requesterTeamId: "team-9" })]
                }
            }
        });

        expect(setup.config.listTeams).not.toHaveBeenCalled();
    });

    it("resolves the ids a step edit introduces", async () => {
        const setup = withWorkflow([createRoutingStep([])]);
        answerUsers(setup, [createListedUser("user-4", "Alan Turing")]);
        await setup.presenter.init(setup.params);
        expect(setup.config.listUsers).not.toHaveBeenCalled();

        setup.presenter.updateStep("step-1", {
            config: {
                teams: ["team-1"],
                assignment: {
                    strategy: "none",
                    allowManualPick: false,
                    rules: [createStoredRule({ id: "r1", target: { type: "user", id: "user-4" } })]
                }
            }
        });

        await vi.waitFor(() => {
            expect(setup.presenter.getReferences().users.get("user-4")?.label).toBe("Alan Turing");
        });
    });

    it("drops the answer of a lookup that a workflow switch replaced", async () => {
        const setup = withWorkflow([
            createRoutingStep([
                createStoredRule({ id: "r1", target: { type: "user", id: "user-1" } })
            ])
        ]);
        setup.useCases.listModels.mockResolvedValue(
            createWorkflowModelPage({
                rows: [
                    createWorkflowModelRow({ modelId: "article", name: "Article" }),
                    createWorkflowModelRow({
                        model: "cms.blog",
                        modelId: "blog",
                        name: "Blog",
                        workflow: { id: "workflow-2", name: "Blog review" }
                    })
                ]
            })
        );
        setup.useCases.getWorkflow.mockImplementation(async id => {
            if (id === "workflow-2") {
                return createEditorWorkflow({ id: "workflow-2", steps: [createRoutingStep([])] });
            }
            return createEditorWorkflow({
                steps: [
                    createRoutingStep([
                        createStoredRule({ id: "r1", target: { type: "user", id: "user-1" } })
                    ])
                ]
            });
        });
        const slow = createDeferred<WorkflowUserList>();
        setup.config.listUsers.mockReturnValueOnce(slow.promise);

        const loading = setup.presenter.init(setup.params);
        await vi.waitFor(() => expect(setup.config.listUsers).toHaveBeenCalledTimes(1));
        await setup.presenter.selectModel("blog");
        slow.resolve({ users: [createListedUser("user-1", "Ada Lovelace")], missingIds: [] });
        await loading;

        expect(setup.presenter.getReferences().users.size).toBe(0);
    });

    it("drops the answer of a lookup that a newer step edit replaced", async () => {
        const setup = withWorkflow([
            createRoutingStep([
                createStoredRule({ id: "r1", target: { type: "user", id: "user-1" } })
            ])
        ]);
        answerUsers(setup, [
            createListedUser("user-1", "Ada Lovelace"),
            createListedUser("user-3", "Alan Turing")
        ]);
        const slow = createDeferred<WorkflowUserList>();
        setup.config.listUsers.mockReturnValueOnce(slow.promise);

        const loading = setup.presenter.init(setup.params);
        await vi.waitFor(() => expect(setup.config.listUsers).toHaveBeenCalledTimes(1));
        setup.presenter.updateStep("step-1", {
            config: {
                teams: ["team-1"],
                assignment: {
                    strategy: "none",
                    allowManualPick: false,
                    rules: [
                        createStoredRule({ id: "r1", target: { type: "user", id: "user-1" } }),
                        createStoredRule({ id: "r2", target: { type: "user", id: "user-3" } })
                    ]
                }
            }
        });
        await vi.waitFor(() => {
            expect(setup.presenter.getReferences().users.get("user-3")?.label).toBe("Alan Turing");
        });
        slow.resolve({ users: [createListedUser("user-1", "Stale name")], missingIds: [] });
        await loading;

        expect(setup.presenter.getReferences().users.get("user-1")?.label).toBe("Ada Lovelace");
    });

    it("does not look a reference up again once every step dropped it", async () => {
        const setup = withWorkflow([
            createRoutingStep([
                createStoredRule({ id: "r1", target: { type: "user", id: "user-1" } })
            ])
        ]);
        setup.config.listUsers.mockRejectedValue(new Error("down"));
        await setup.presenter.init(setup.params);
        expect(setup.config.listUsers).toHaveBeenCalledTimes(1);

        setup.presenter.updateStep("step-1", {
            config: {
                teams: ["team-1"],
                assignment: { strategy: "none", allowManualPick: false, rules: [] }
            }
        });
        setup.config.listUsers.mockClear();
        setup.presenter.retryReferences();

        expect(setup.config.listUsers).not.toHaveBeenCalled();
    });

    it("rebuilds the maps from the saved ids after a successful save", async () => {
        const setup = withWorkflow([
            createRoutingStep([
                createStoredRule({ id: "r1", target: { type: "user", id: "user-1" } })
            ])
        ]);
        answerUsers(setup, [
            createListedUser("user-1", "Ada Lovelace"),
            createListedUser("user-2", "Grace Hopper")
        ]);
        await setup.presenter.init(setup.params);
        expect(setup.presenter.getReferences().users.has("user-1")).toBe(true);
        setup.useCases.storeWorkflow.mockResolvedValue(
            createEditorWorkflow({
                steps: [
                    createRoutingStep([
                        createStoredRule({ id: "r1", target: { type: "user", id: "user-2" } })
                    ])
                ]
            })
        );
        setup.presenter.setName("Changed");
        setup.config.listUsers.mockClear();

        await setup.presenter.save();

        await vi.waitFor(() => {
            expect(setup.presenter.getReferences().users.get("user-2")?.label).toBe("Grace Hopper");
        });
        expect(setup.config.listUsers).toHaveBeenCalledWith({
            search: null,
            ids: ["user-2"],
            teamIds: null,
            limit: null
        });
        expect(setup.presenter.getReferences().users.has("user-1")).toBe(false);
    });
});

describe("WorkflowEditorPresenter: teams off (R290, R309, Review Focus 5)", () => {
    const withTeamsOff = (steps: EditorStep[]): EditorPresenterSetup => {
        const setup = withWorkflow(steps);
        setup.config.listStepTypes.mockResolvedValue(
            createStepTypes().map(item => {
                return item.type === "review"
                    ? { ...item, available: false, unavailableReason: "Teams are not enabled." }
                    : item;
            })
        );
        return setup;
    };

    it("makes no team, user or folder lookup for a saved People step", async () => {
        const setup = withTeamsOff([createRoutingStep(fullRules())]);

        await setup.presenter.init(setup.params);

        expect(setup.config.listTeams).not.toHaveBeenCalled();
        expect(setup.config.listUsers).not.toHaveBeenCalled();
        expect(setup.app.listFolders).not.toHaveBeenCalled();
        expect(setup.useCases.folderExists).not.toHaveBeenCalled();
        expect(setup.presenter.getReferences().users.size).toBe(0);
        expect(setup.presenter.vm.optionsBanner).toBeNull();
    });

    it("reports a People step read-only and leaves the others editable", async () => {
        const setup = withTeamsOff([createRoutingStep([])]);

        await setup.presenter.init(setup.params);

        expect(setup.presenter.isStepReadOnly("step-1")).toBe(true);
    });
});
