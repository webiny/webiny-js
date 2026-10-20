import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { TEAMS_OFF_STEP_MESSAGE } from "~/editor/model/teamsOffMessage.js";
import { createStepTypes } from "~/editor/testing/draftFixtures.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";
import { createRoutingStep } from "~/editor/testing/routingStepFixtures.js";
import { createStoredRule } from "~/editor/testing/routingStepFixtures.js";

describe("WorkflowEditorPresenter: step warnings for the drawer (R312)", () => {
    it("returns the step's warnings and its rule warning lines", async () => {
        const setup = createEditorPresenterSetup();
        setup.getWorkflow.execute.mockResolvedValue(
            createEditorWorkflow({
                steps: [
                    createRoutingStep([
                        createStoredRule({ id: "r-1", target: { type: "user", id: "user-1" } })
                    ])
                ]
            })
        );
        setup.listWorkflowTeams.execute.mockResolvedValue({
            teams: [createWorkflowTeamSummary({ id: "team-1", name: "Editors", memberCount: 0 })],
            missingIds: []
        });
        setup.listWorkflowUsers.execute.mockResolvedValue({ users: [], missingIds: ["user-1"] });
        setup.app.listFolders.mockResolvedValue([]);
        setup.folderExists.execute.mockResolvedValue(true);

        await setup.presenter.init(setup.params);

        expect(setup.presenter.getStepWarnings("step-1")).toEqual([
            { text: "Editors has no members.", severity: "warning" },
            { text: "Rule 1: The assigned user was deleted.", severity: "error", ruleId: "r-1" }
        ]);
    });

    it("is empty for a step that is not in the draft", async () => {
        const setup = createEditorPresenterSetup();
        await setup.presenter.init(setup.params);

        expect(setup.presenter.getStepWarnings("missing")).toEqual([]);
    });

    it("tells a saved People step that teams are off (R309)", async () => {
        const setup = createEditorPresenterSetup();
        setup.listStepTypes.execute.mockResolvedValue(
            createStepTypes().map(item => {
                return item.type === "review"
                    ? { ...item, available: false, unavailableReason: "Teams are not enabled." }
                    : item;
            })
        );

        await setup.presenter.init(setup.params);

        expect(setup.presenter.getStepWarnings("step-1")).toContainEqual({
            text: TEAMS_OFF_STEP_MESSAGE,
            severity: "warning"
        });
    });
});
