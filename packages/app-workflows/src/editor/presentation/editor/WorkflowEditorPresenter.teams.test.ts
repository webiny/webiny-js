import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createAutomationDefinition } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPage } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelRow } from "~/editor/testing/editorFixtures.js";

describe("WorkflowEditorPresenter: team names of the open workflow (R268, Review Focus 9)", () => {
    it("resolves the distinct team ids of every People step with one listTeams call", async () => {
        const { presenter, params, useCases, config } = createEditorPresenterSetup();
        useCases.getWorkflow.mockResolvedValue(
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

        await presenter.init(params);

        expect(config.listTeams).toHaveBeenCalledTimes(1);
        expect(config.listTeams).toHaveBeenCalledWith({
            search: null,
            ids: ["team-1", "team-2"],
            limit: null
        });
        expect(presenter.vm.optionsBanner).toBeNull();
    });

    it("also resolves the team a ui team setting of an automation step holds (R284)", async () => {
        const { presenter, params, useCases, config } = createEditorPresenterSetup();
        config.listAutomationDefinitions.mockResolvedValue([
            createAutomationDefinition({
                id: "notify-team",
                models: ["*"],
                settingsSchema: {
                    type: "object",
                    properties: { owner: { type: "string", ui: "team" } }
                }
            })
        ]);
        useCases.getWorkflow.mockResolvedValue(
            createEditorWorkflow({
                steps: [
                    createAutomationStep({
                        config: { automationId: "notify-team", settings: { owner: "team-7" } }
                    })
                ]
            })
        );

        await presenter.init(params);

        expect(config.listTeams).toHaveBeenCalledWith({
            search: null,
            ids: ["team-7"],
            limit: null
        });
    });

    it("does not call listTeams for a workflow without People steps", async () => {
        const { presenter, params, useCases, config } = createEditorPresenterSetup();
        useCases.getWorkflow.mockResolvedValue(createEditorWorkflow({ steps: [] }));

        await presenter.init(params);

        expect(config.listTeams).not.toHaveBeenCalled();
    });

    it("does not look known teams up again on Try again", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();
        await presenter.init(params);
        expect(config.listTeams).toHaveBeenCalledTimes(1);
        config.listTeams.mockClear();

        await presenter.retryOptions();

        expect(config.listTeams).not.toHaveBeenCalled();
    });

    it("asks for at most 200 ids, the server's cap", async () => {
        const { presenter, params, useCases, config } = createEditorPresenterSetup();
        const teams = Array.from({ length: 250 }, (_, index) => `team-${index}`);
        useCases.getWorkflow.mockResolvedValue(
            createEditorWorkflow({
                steps: [createReviewStep({ config: { teams, assignment: null } })]
            })
        );

        await presenter.init(params);

        const request = config.listTeams.mock.calls[0][0];
        expect(request.ids).toHaveLength(200);
        expect(request.ids?.[0]).toBe("team-0");
    });

    it("shows the options banner when the lookup fails, and Try again looks the teams up again", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();
        config.listTeams.mockRejectedValueOnce(new Error("down"));

        await presenter.init(params);

        expect(presenter.vm.optionsBanner).toEqual({ message: "Could not load the step options." });

        config.listTeams.mockResolvedValueOnce({
            teams: [createWorkflowTeamSummary({ id: "team-1", name: "Editors" })],
            missingIds: []
        });
        await presenter.retryOptions();

        expect(config.listTeams).toHaveBeenCalledTimes(2);
        expect(presenter.vm.optionsBanner).toBeNull();
    });

    it("clears the banner of a failed lookup when another workflow needs none", async () => {
        const { presenter, params, useCases, config } = createEditorPresenterSetup();
        useCases.listModels.mockResolvedValue(
            createWorkflowModelPage({
                rows: [
                    createWorkflowModelRow({ modelId: "article", name: "Article" }),
                    createWorkflowModelRow({
                        model: "cms.blog",
                        modelId: "blog",
                        name: "Blog",
                        workflow: null
                    })
                ]
            })
        );
        config.listTeams.mockRejectedValueOnce(new Error("down"));
        await presenter.init(params);
        expect(presenter.vm.optionsBanner).not.toBeNull();

        await presenter.selectModel("blog");

        expect(presenter.vm.optionsBanner).toBeNull();
    });
});
