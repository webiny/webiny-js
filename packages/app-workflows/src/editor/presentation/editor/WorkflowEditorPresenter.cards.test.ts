import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
import type { WorkflowEditorPresenter } from "~/editor/presentation/editor/abstractions.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import type { EditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createEditorStepType } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { flushPromises } from "~/editor/testing/flushPromises.js";

const TEAM_TARGET = { type: "team", id: "team-1" };
const FOLDER = { id: "f1", type: "cms:article", includeDescendants: false };

const RULE_PLAIN = { id: "r1", conditions: {}, target: TEAM_TARGET };
const RULE_DELETED_FOLDER = { id: "r2", conditions: { folder: FOLDER }, target: TEAM_TARGET };
const RULE_NO_TARGET = { id: "r1", conditions: {} };

const warningLine = (text: string, ruleId?: string): StepWarningLine => {
    if (ruleId === undefined) {
        return { text, severity: "warning" };
    }
    return { text, severity: "warning", ruleId };
};

const errorLine = (text: string, ruleId: string): StepWarningLine => {
    return { text, severity: "error", ruleId };
};

const assignmentWith = (rules: Record<string, unknown>[]) => {
    return { strategy: "roundRobin", allowManualPick: true, rules };
};

const peopleConfig = (rules: Record<string, unknown>[]) => {
    return { teams: ["team-1"], assignment: assignmentWith(rules) };
};

const openWith = async (rules: Record<string, unknown>[]): Promise<EditorPresenterSetup> => {
    const setup = createEditorPresenterSetup();
    const step = createReviewStep({ config: peopleConfig(rules) });
    setup.getWorkflow.execute.mockResolvedValue(createEditorWorkflow({ steps: [step] }));
    // The folder of the second rule is in no list and `folderExists` says it is gone.
    setup.app.listFolders.mockResolvedValue([]);
    setup.folderExists.execute.mockResolvedValue(false);
    await setup.presenter.init(setup.params);
    return setup;
};

const cardOf = (presenter: WorkflowEditorPresenter.Interface) => {
    return presenter.vm.flow.steps[0];
};

describe("WorkflowEditorPresenter: People step card lines (R299, R303, R308, R309)", () => {
    it("summarises the teams, the strategy, the rule count and the requester pick", async () => {
        const { presenter } = await openWith([RULE_PLAIN, RULE_DELETED_FOLDER]);

        expect(cardOf(presenter).summary).toBe(
            "Editors · Round-robin · 2 routing rules · requester can pick"
        );
    });

    it("says 1 routing rule for a single rule", async () => {
        const { presenter } = await openWith([RULE_PLAIN]);

        expect(cardOf(presenter).summary).toBe(
            "Editors · Round-robin · 1 routing rule · requester can pick"
        );
    });

    it("prefixes the warning of a rule with its number", async () => {
        const { presenter } = await openWith([RULE_PLAIN, RULE_DELETED_FOLDER]);

        await vi.waitFor(() => {
            expect(cardOf(presenter).warnings).toEqual([
                warningLine("Rule 2: The folder no longer exists.", "r2")
            ]);
        });
        expect(cardOf(presenter).error).toBeNull();
    });

    it("renumbers the lines when the rules are reordered and does not look the folder up again", async () => {
        const { presenter, folderExists } = await openWith([RULE_PLAIN, RULE_DELETED_FOLDER]);
        await vi.waitFor(() => {
            expect(cardOf(presenter).warnings).toEqual([
                warningLine("Rule 2: The folder no longer exists.", "r2")
            ]);
        });

        presenter.updateStep("step-1", {
            config: peopleConfig([RULE_DELETED_FOLDER, RULE_PLAIN])
        });

        expect(cardOf(presenter).warnings).toEqual([
            warningLine("Rule 1: The folder no longer exists.", "r2")
        ]);
        // The lookups run deferred: let them settle before counting the folder checks.
        await flushPromises();
        expect(folderExists.execute).toHaveBeenCalledTimes(1);
    });

    it("renumbers and recounts when a rule is deleted", async () => {
        const { presenter } = await openWith([RULE_PLAIN, RULE_DELETED_FOLDER]);
        await vi.waitFor(() => {
            expect(cardOf(presenter).warnings).toEqual([
                warningLine("Rule 2: The folder no longer exists.", "r2")
            ]);
        });

        presenter.updateStep("step-1", { config: peopleConfig([RULE_DELETED_FOLDER]) });

        expect(cardOf(presenter).warnings).toEqual([
            warningLine("Rule 1: The folder no longer exists.", "r2")
        ]);
        expect(cardOf(presenter).summary).toBe(
            "Editors · Round-robin · 1 routing rule · requester can pick"
        );
    });

    it("shows no warning for a folder the admin cannot see (restricted)", async () => {
        const setup = createEditorPresenterSetup();
        const step = createReviewStep({ config: peopleConfig([RULE_DELETED_FOLDER]) });
        setup.getWorkflow.execute.mockResolvedValue(createEditorWorkflow({ steps: [step] }));
        setup.app.listFolders.mockResolvedValue([]);
        setup.folderExists.execute.mockResolvedValue(true);
        await setup.presenter.init(setup.params);

        await vi.waitFor(() => {
            expect(setup.folderExists.execute).toHaveBeenCalledTimes(1);
        });

        expect(cardOf(setup.presenter).warnings).toEqual([]);
    });

    it("lists the live error of a rule without a target as an error line before any Save", async () => {
        const { presenter } = await openWith([RULE_NO_TARGET]);

        expect(cardOf(presenter).warnings).toEqual([
            errorLine("Rule 1: Choose who this rule assigns to.", "r1")
        ]);
        expect(cardOf(presenter).error).toBeNull();
    });

    it("shows the strip after a blocked Save and does not repeat it as a line", async () => {
        const { presenter, storeWorkflow } = await openWith([RULE_NO_TARGET]);
        presenter.setName("Article review v2");

        await presenter.save();

        expect(storeWorkflow.execute).not.toHaveBeenCalled();
        expect(cardOf(presenter).error).toBe("Rule 1: Choose who this rule assigns to.");
        expect(cardOf(presenter).warnings).toEqual([]);
    });

    it("shows the teams-off line and an empty summary for a People step of an unavailable review row", async () => {
        const setup = createEditorPresenterSetup();
        setup.listStepTypes.execute.mockResolvedValue([
            createEditorStepType({
                type: "review",
                title: "Review",
                available: false,
                unavailableReason: "Teams are not enabled."
            }),
            createEditorStepType({ type: "automation", title: "Automation" }),
            createEditorStepType({ type: "ai", title: "AI" })
        ]);
        const rules = [
            { id: "r1", conditions: {}, target: { type: "user", id: "user-9" } },
            RULE_DELETED_FOLDER
        ];
        const step = createReviewStep({ config: peopleConfig(rules) });
        setup.getWorkflow.execute.mockResolvedValue(createEditorWorkflow({ steps: [step] }));
        setup.app.listFolders.mockResolvedValue([]);
        setup.folderExists.execute.mockResolvedValue(false);

        await setup.presenter.init(setup.params);

        const card = cardOf(setup.presenter);
        expect(card.summary).toBe("");
        expect(card.warnings).toEqual([
            warningLine("This step needs teams, which are not enabled. It can't be edited.")
        ]);
        expect(card.readOnly).toBe(true);
        expect(card.error).toBeNull();
        expect(setup.listWorkflowTeams.execute).not.toHaveBeenCalled();
        expect(setup.listWorkflowUsers.execute).not.toHaveBeenCalled();
    });
});
