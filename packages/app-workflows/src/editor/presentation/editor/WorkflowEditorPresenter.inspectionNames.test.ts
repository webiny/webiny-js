import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import type { EditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";
import { createListedUser } from "~/editor/testing/routingStepFixtures.js";
import { createRoutingStep } from "~/editor/testing/routingStepFixtures.js";
import { createStoredRule } from "~/editor/testing/routingStepFixtures.js";
import { createTestInspection } from "~/editor/testing/routingStepFixtures.js";

const DIRECTORY = [
    createListedUser("user-1", "Ada Lovelace"),
    createListedUser("user-2", "Grace Hopper"),
    createListedUser("user-3", "Alan Turing")
];

const answerUsers = (setup: EditorPresenterSetup, directory: WorkflowUserSummary[]): void => {
    setup.listWorkflowUsers.execute.mockImplementation(async params => {
        const ids = params.ids ?? [];
        const users = directory.filter(user => ids.includes(user.id));
        const missingIds = ids.filter(id => !directory.some(user => user.id === id));
        return { users, missingIds };
    });
};

// An opened editor whose only rule targets `user-1`, so the maps know Ada and the team Editors.
const openedSetup = async (): Promise<EditorPresenterSetup> => {
    const setup = createEditorPresenterSetup();
    setup.getWorkflow.execute.mockResolvedValue(
        createEditorWorkflow({
            steps: [
                createRoutingStep([
                    createStoredRule({ id: "r1", target: { type: "user", id: "user-1" } })
                ])
            ]
        })
    );
    setup.app.listFolders.mockResolvedValue([]);
    setup.folderExists.execute.mockResolvedValue(true);
    answerUsers(setup, DIRECTORY);
    setup.listWorkflowTeams.execute.mockImplementation(async params => {
        const ids = params.ids ?? [];
        const known = [
            createWorkflowTeamSummary({ id: "team-1", name: "Editors" }),
            createWorkflowTeamSummary({ id: "team-9", name: "Marketing" })
        ];
        return {
            teams: known.filter(team => ids.includes(team.id)),
            missingIds: ids.filter(id => !known.some(team => team.id === id))
        };
    });
    await setup.presenter.init(setup.params);
    setup.listWorkflowUsers.execute.mockClear();
    setup.listWorkflowTeams.execute.mockClear();
    return setup;
};

describe("WorkflowEditorPresenter: inspection names (R301, Review Focus 7)", () => {
    it("takes names from the maps first and asks nothing when every id is known", async () => {
        const setup = await openedSetup();

        const names = await setup.presenter.resolveInspectionNames(
            createTestInspection({
                candidateIds: ["user-1"],
                candidateCount: 1,
                narrowedTeamId: "team-1"
            })
        );

        expect(names.users.get("user-1")).toBe("Ada Lovelace");
        expect(names.teams.get("team-1")).toBe("Editors");
        expect(setup.listWorkflowUsers.execute).not.toHaveBeenCalled();
        expect(setup.listWorkflowTeams.execute).not.toHaveBeenCalled();
    });

    it("looks up only the ids the maps do not know", async () => {
        const setup = await openedSetup();

        const names = await setup.presenter.resolveInspectionNames(
            createTestInspection({
                candidateIds: ["user-1", "user-2", "user-3"],
                candidateCount: 5,
                narrowedTeamId: "team-9"
            })
        );

        expect(setup.listWorkflowUsers.execute).toHaveBeenCalledTimes(1);
        expect(setup.listWorkflowUsers.execute).toHaveBeenCalledWith({
            search: null,
            ids: ["user-2", "user-3"],
            teamIds: null,
            limit: null
        });
        expect(setup.listWorkflowTeams.execute).toHaveBeenCalledTimes(1);
        expect(setup.listWorkflowTeams.execute).toHaveBeenCalledWith({
            search: null,
            ids: ["team-9"],
            limit: null
        });
        expect(names.users.get("user-2")).toBe("Grace Hopper");
        expect(names.users.get("user-3")).toBe("Alan Turing");
        expect(names.teams.get("team-9")).toBe("Marketing");
    });

    it("leaves the ids unnamed when a lookup throws synchronously", async () => {
        const setup = await openedSetup();
        setup.listWorkflowUsers.execute.mockImplementation(() => {
            throw new Error("sync");
        });

        const names = await setup.presenter.resolveInspectionNames(
            createTestInspection({
                skipped: [{ userId: "user-2", displayName: null, reason: "Cannot read." }]
            })
        );

        expect(names.users.get("user-2")).toBeUndefined();
    });

    it("names a skipped person the server did not name, and leaves the named ones alone", async () => {
        const setup = await openedSetup();

        const names = await setup.presenter.resolveInspectionNames(
            createTestInspection({
                skipped: [
                    { userId: "user-2", displayName: null, reason: "Cannot read this content." },
                    {
                        userId: "user-3",
                        displayName: "Alan Turing",
                        reason: "Excluded from reviews."
                    }
                ]
            })
        );

        expect(setup.listWorkflowUsers.execute).toHaveBeenCalledWith({
            search: null,
            ids: ["user-2"],
            teamIds: null,
            limit: null
        });
        expect(names.users.get("user-2")).toBe("Grace Hopper");
        expect(names.users.has("user-3")).toBe(false);
    });

    it("leaves an id the server reports missing out of the names", async () => {
        const setup = await openedSetup();

        const names = await setup.presenter.resolveInspectionNames(
            createTestInspection({
                skipped: [{ userId: "user-77", displayName: null, reason: "Excluded." }]
            })
        );

        expect(setup.listWorkflowUsers.execute).toHaveBeenCalledTimes(1);
        expect(names.users.has("user-77")).toBe(false);
    });

    it("resolves with what is known when a lookup fails, and does not throw", async () => {
        const setup = await openedSetup();
        setup.listWorkflowUsers.execute.mockRejectedValue(new Error("down"));

        const names = await setup.presenter.resolveInspectionNames(
            createTestInspection({
                candidateIds: ["user-1", "user-2"],
                candidateCount: 2,
                narrowedTeamId: "team-9"
            })
        );

        expect(names.users.get("user-1")).toBe("Ada Lovelace");
        expect(names.users.has("user-2")).toBe(false);
        expect(names.teams.get("team-9")).toBe("Marketing");
    });

    it("resolves with the users when the team lookup fails", async () => {
        const setup = await openedSetup();
        setup.listWorkflowTeams.execute.mockRejectedValue(new Error("down"));

        const names = await setup.presenter.resolveInspectionNames(
            createTestInspection({
                candidateIds: ["user-2"],
                candidateCount: 1,
                narrowedTeamId: "team-9"
            })
        );

        expect(names.users.get("user-2")).toBe("Grace Hopper");
        expect(names.teams.has("team-9")).toBe(false);
    });

    it("asks 200 user ids per call", async () => {
        const setup = await openedSetup();
        const skipped = Array.from({ length: 250 }, (_, index) => {
            return { userId: `user-s${index}`, displayName: null, reason: "Cannot read." };
        });

        await setup.presenter.resolveInspectionNames(createTestInspection({ skipped }));

        const sizes = setup.listWorkflowUsers.execute.mock.calls.map(
            call => (call[0].ids ?? []).length
        );
        expect(sizes).toEqual([200, 50]);
    });
});
