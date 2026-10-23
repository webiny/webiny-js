import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";

afterEach(() => {
    vi.useRealTimers();
});

describe("WorkflowEditorPresenter: team names on the cards (R268)", () => {
    it("shows the resolved names of every People step", async () => {
        const { presenter, params, getWorkflow, listWorkflowTeams } = createEditorPresenterSetup();
        getWorkflow.execute.mockResolvedValue(
            createEditorWorkflow({
                steps: [
                    createReviewStep({
                        id: "a",
                        config: { teams: ["team-1", "team-2"], assignment: null }
                    }),
                    createReviewStep({ id: "b", config: { teams: ["team-2"], assignment: null } })
                ]
            })
        );
        listWorkflowTeams.execute.mockResolvedValue({
            teams: [
                createWorkflowTeamSummary({ id: "team-1", name: "Editors" }),
                createWorkflowTeamSummary({ id: "team-2", name: "Legal" })
            ],
            missingIds: []
        });

        await presenter.init(params);

        expect(presenter.vm.flow.steps.map(step => step.summary)).toEqual([
            "Editors + Legal · Team pool",
            "Legal · Team pool"
        ]);
        expect(presenter.getTeamOptions().known.map(team => team.id)).toEqual(["team-1", "team-2"]);
    });

    it("names a team the server could not find as Unknown item", async () => {
        const { presenter, params, listWorkflowTeams } = createEditorPresenterSetup();
        listWorkflowTeams.execute.mockResolvedValue({ teams: [], missingIds: ["team-1"] });

        await presenter.init(params);

        expect(presenter.vm.flow.steps[0].summary).toBe("Unknown item · Team pool");
        expect(presenter.vm.optionsBanner).toBeNull();
    });

    it("warns about a team without members", async () => {
        const { presenter, params, listWorkflowTeams } = createEditorPresenterSetup();
        listWorkflowTeams.execute.mockResolvedValue({
            teams: [createWorkflowTeamSummary({ id: "team-1", name: "Editors", memberCount: 0 })],
            missingIds: []
        });

        await presenter.init(params);

        expect(presenter.vm.flow.steps[0].warnings).toEqual([
            { text: "Editors has no members.", severity: "warning" }
        ]);
    });

    it("shows the names after Try again when the first lookup failed", async () => {
        const { presenter, params, listWorkflowTeams } = createEditorPresenterSetup();
        listWorkflowTeams.execute.mockRejectedValueOnce(new Error("down"));
        await presenter.init(params);
        expect(presenter.vm.flow.steps[0].summary).toBe("Unknown item · Team pool");

        await presenter.retryOptions();

        expect(presenter.vm.flow.steps[0].summary).toBe("Editors · Team pool");
        expect(presenter.vm.optionsBanner).toBeNull();
    });
});

describe("WorkflowEditorPresenter: team search (R268, R282)", () => {
    it("runs an empty search at once with the default limit", async () => {
        const { presenter, params, listWorkflowTeams } = createEditorPresenterSetup();
        await presenter.init(params);
        listWorkflowTeams.execute.mockClear();
        listWorkflowTeams.execute.mockResolvedValue({
            teams: [createWorkflowTeamSummary({ id: "team-9", name: "Press" })],
            missingIds: []
        });

        presenter.searchTeams("");
        await vi.waitFor(() => expect(listWorkflowTeams.execute).toHaveBeenCalledTimes(1));

        expect(listWorkflowTeams.execute).toHaveBeenCalledWith({
            search: null,
            ids: null,
            limit: 50
        });
        await vi.waitFor(() => expect(presenter.getTeamOptions().results).toHaveLength(1));
        expect(presenter.getTeamOptions().results[0].name).toBe("Press");
        expect(presenter.getTeamOptions().loading).toBe(false);
    });

    it("debounces a typed search by 250 ms", async () => {
        const { presenter, params, listWorkflowTeams } = createEditorPresenterSetup();
        await presenter.init(params);
        listWorkflowTeams.execute.mockClear();
        vi.useFakeTimers();

        presenter.searchTeams("le");
        presenter.searchTeams("leg");
        await vi.advanceTimersByTimeAsync(249);
        expect(listWorkflowTeams.execute).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);

        expect(listWorkflowTeams.execute).toHaveBeenCalledTimes(1);
        expect(listWorkflowTeams.execute).toHaveBeenCalledWith({
            search: "leg",
            ids: null,
            limit: 50
        });
    });

    it("merges the results into the known teams, so a chip keeps its name when the search narrows", async () => {
        const { presenter, params, listWorkflowTeams } = createEditorPresenterSetup();
        await presenter.init(params);
        listWorkflowTeams.execute.mockResolvedValue({
            teams: [createWorkflowTeamSummary({ id: "team-9", name: "Press", memberCount: 0 })],
            missingIds: []
        });

        presenter.searchTeams("");
        await vi.waitFor(() => expect(presenter.getTeamOptions().results).toHaveLength(1));

        const known = presenter.getTeamOptions().known.map(team => team.id);
        expect(known).toContain("team-1");
        expect(known).toContain("team-9");
    });

    it("flags a failed search and repeats the last search on retry", async () => {
        const { presenter, params, listWorkflowTeams } = createEditorPresenterSetup();
        await presenter.init(params);
        listWorkflowTeams.execute.mockClear();
        listWorkflowTeams.execute.mockRejectedValueOnce(new Error("down"));

        presenter.searchTeams("");
        await vi.waitFor(() => expect(presenter.getTeamOptions().failed).toBe(true));
        expect(presenter.vm.optionsBanner).not.toBeNull();

        listWorkflowTeams.execute.mockResolvedValueOnce({
            teams: [createWorkflowTeamSummary({ id: "team-9", name: "Press" })],
            missingIds: []
        });
        await presenter.retryTeams();

        expect(presenter.getTeamOptions().failed).toBe(false);
        expect(presenter.getTeamOptions().results[0].name).toBe("Press");
        expect(listWorkflowTeams.execute).toHaveBeenLastCalledWith({
            search: null,
            ids: null,
            limit: 50
        });
    });
});

describe("WorkflowEditorPresenter: Try again clears a failed team search (R284)", () => {
    it("repeats the search when the banner's Try again runs", async () => {
        const { presenter, params, listWorkflowTeams } = createEditorPresenterSetup();
        await presenter.init(params);
        listWorkflowTeams.execute.mockClear();
        listWorkflowTeams.execute.mockRejectedValueOnce(new Error("down"));
        presenter.searchTeams("");
        await vi.waitFor(() => expect(presenter.getTeamOptions().failed).toBe(true));
        expect(presenter.vm.optionsBanner).not.toBeNull();

        await presenter.retryOptions();

        expect(presenter.vm.optionsBanner).toBeNull();
        expect(presenter.getTeamOptions().failed).toBe(false);
        expect(listWorkflowTeams.execute).toHaveBeenLastCalledWith({
            search: null,
            ids: null,
            limit: 50
        });
    });
});
