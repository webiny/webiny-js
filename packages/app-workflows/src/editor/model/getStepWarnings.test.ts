import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAiModel } from "~/editor/testing/editorFixtures.js";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";
import { createAssignmentValue } from "~/editor/testing/ruleFixtures.js";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { createRuleReferences } from "~/editor/testing/ruleFixtures.js";
import { createRuleValue } from "~/editor/testing/ruleFixtures.js";
import { assignmentToConfig } from "./assignment/assignmentToConfig.js";
import type { RuleValue } from "./assignment/RuleValue.js";
import { getStepWarnings } from "./getStepWarnings.js";
import { createEmptyRuleReferences } from "./rules/createEmptyRuleReferences.js";
import type { StepContext } from "./StepContext.js";
import type { StepWarningLine } from "./StepWarningLine.js";
import { TEAMS_OFF_STEP_MESSAGE } from "./teamsOffMessage.js";

const context = (overrides: Partial<StepContext> = {}): StepContext => {
    return {
        teams: [createWorkflowTeamSummary({ id: "team-1", name: "Legal", memberCount: 3 })],
        automations: [createWebhookAutomation()],
        automationsLoaded: true,
        aiModels: [createAiModel()],
        aiTools: [],
        aiEditable: true,
        baselineStep: null,
        references: createEmptyRuleReferences(),
        reviewAvailable: true,
        ...overrides
    };
};

const warning = (text: string): StepWarningLine => {
    return { text, severity: "warning" };
};

describe("getStepWarnings: People", () => {
    it("is clean when every team has members", () => {
        const lines = getStepWarnings(createReviewStep(), context());

        expect(lines).toEqual([]);
    });

    it("names each known team without members", () => {
        const step = createReviewStep({
            config: { teams: ["team-1", "team-2", "team-3"], assignment: null }
        });
        const teams = [
            createWorkflowTeamSummary({ id: "team-1", name: "Legal", memberCount: 0 }),
            createWorkflowTeamSummary({ id: "team-2", name: "Editors", memberCount: 2 }),
            createWorkflowTeamSummary({ id: "team-3", name: "Press", memberCount: 0 })
        ];

        const lines = getStepWarnings(step, context({ teams }));

        expect(lines).toEqual([warning("Legal has no members."), warning("Press has no members.")]);
    });

    it("does not warn about a team that is not known", () => {
        const step = createReviewStep({ config: { teams: ["gone"], assignment: null } });

        const lines = getStepWarnings(step, context());

        expect(lines).toEqual([]);
    });
});

describe("getStepWarnings: Automation", () => {
    it("is clean for a listed automation with valid settings", () => {
        const lines = getStepWarnings(createAutomationStep(), context());

        expect(lines).toEqual([]);
    });

    it("warns when the stored automation no longer exists", () => {
        const step = createAutomationStep({ config: { automationId: "gone", settings: {} } });

        const lines = getStepWarnings(step, context());

        expect(lines).toEqual([warning("The automation “gone” no longer exists.")]);
    });

    it("does not call an automation gone while the list did not load", () => {
        const step = createAutomationStep({ config: { automationId: "gone", settings: {} } });
        const notLoaded = context({ automationsLoaded: false, automations: [] });

        const lines = getStepWarnings(step, notLoaded);

        expect(lines).toEqual([]);
    });

    it("does not warn before an automation is chosen", () => {
        const step = createAutomationStep({ config: { automationId: "", settings: {} } });

        const lines = getStepWarnings(step, context());

        expect(lines).toEqual([]);
    });

    it("warns that saved settings no longer validate when they are unchanged (QBZ-13)", () => {
        const stored = createAutomationStep({
            config: { automationId: "send-webhook", settings: { url: 5 } }
        });

        const lines = getStepWarnings(stored, context({ baselineStep: stored }));

        expect(lines).toHaveLength(1);
        expect(lines[0].severity).toBe("warning");
        expect(lines[0].text.startsWith("Saved settings no longer validate: ")).toBe(true);
        expect(lines[0].text.length).toBeGreaterThan("Saved settings no longer validate: ".length);
    });

    it("says nothing once the admin changed the settings in this session (QBZ-13)", () => {
        const stored = createAutomationStep({
            config: { automationId: "send-webhook", settings: { url: 5 } }
        });
        const edited = createAutomationStep({
            config: { automationId: "send-webhook", settings: { url: 6 } }
        });

        const lines = getStepWarnings(edited, context({ baselineStep: stored }));

        expect(lines).toEqual([]);
    });

    it("says nothing about the settings of a step that is not on the server yet", () => {
        const step = createAutomationStep({
            config: { automationId: "send-webhook", settings: { url: 5 } }
        });

        const lines = getStepWarnings(step, context({ baselineStep: null }));

        expect(lines).toEqual([]);
    });

    it("says nothing when the stored settings still validate", () => {
        const stored = createAutomationStep();

        const lines = getStepWarnings(stored, context({ baselineStep: stored }));

        expect(lines).toEqual([]);
    });
});

describe("getStepWarnings: AI", () => {
    it("is clean for an offered model", () => {
        const lines = getStepWarnings(createAiStep(), context());

        expect(lines).toEqual([]);
    });

    it("warns about the licence when the AI editor does not exist, and only that", () => {
        const step = createAiStep({
            config: { instructions: "i", model: "openai/old-model", tools: [] }
        });
        const noEditor = context({ aiEditable: false, aiModels: null });

        const lines = getStepWarnings(step, noEditor);

        expect(lines).toEqual([
            warning(
                "AI Power-Ups licence missing. This step fails when reached and can be restarted once the licence is back."
            )
        ]);
    });

    it("warns about a retired model (QBZ-8)", () => {
        const step = createAiStep({
            config: { instructions: "i", model: "openai/old-model", tools: [] }
        });

        const lines = getStepWarnings(step, context());

        expect(lines).toEqual([
            warning(
                "The AI model “openai/old-model” is no longer offered. Choose another model; until then this step fails when reached."
            )
        ]);
    });

    it("does not call a model retired without a loaded, non-empty list, or before one is chosen", () => {
        const stored = createAiStep({
            config: { instructions: "i", model: "openai/old-model", tools: [] }
        });
        const fresh = createAiStep({ config: { instructions: "", model: "", tools: [] } });

        const notLoaded = getStepWarnings(stored, context({ aiModels: null }));
        const emptyList = getStepWarnings(stored, context({ aiModels: [] }));
        const noModelChosen = getStepWarnings(fresh, context());

        expect(notLoaded).toEqual([]);
        expect(emptyList).toEqual([]);
        expect(noModelChosen).toEqual([]);
    });
});

describe("getStepWarnings: unknown type", () => {
    it("has none", () => {
        const step = createReviewStep({ type: "custom", config: {} });

        const lines = getStepWarnings(step, context());

        expect(lines).toEqual([]);
    });
});

describe("getStepWarnings: People rules (R299, R312)", () => {
    const references = createRuleReferences({
        users: [createReferenceLabel({ id: "user-out", label: "Maja Kos" })],
        folders: [createReferenceLabel({ id: "fx", label: "Deleted folder", state: "deleted" })],
        userTeamIds: { "user-out": ["team-7"] }
    });

    const stepWith = (rules: RuleValue[]) => {
        const assignment = assignmentToConfig(createAssignmentValue({ rules }));

        return createReviewStep({ config: { teams: ["team-1"], assignment } });
    };

    it("is clean for rules without an issue", () => {
        const step = stepWith([createRuleValue({ id: "a" })]);

        const lines = getStepWarnings(step, context({ references }));

        expect(lines).toEqual([]);
    });

    it("marks a rule warning as a warning, prefixed with its position and carrying the rule id", () => {
        const step = stepWith([
            createRuleValue({ id: "a" }),
            createRuleValue({
                id: "b",
                folder: { id: "fx", type: "cms:article", includeDescendants: false }
            })
        ]);

        const lines = getStepWarnings(step, context({ references }));

        expect(lines).toEqual([
            {
                text: "Rule 2: The folder no longer exists.",
                severity: "warning",
                ruleId: "b"
            }
        ]);
    });

    it("marks the live error lines as errors, in rule order", () => {
        const step = stepWith([
            createRuleValue({ id: "a", target: null }),
            createRuleValue({ id: "b", target: { type: "user", id: "user-out" } })
        ]);

        const lines = getStepWarnings(step, context({ references }));

        expect(lines).toEqual([
            {
                text: "Rule 1: Choose who this rule assigns to.",
                severity: "error",
                ruleId: "a"
            },
            {
                text: "Rule 2: Maja Kos is no longer in the reviewing teams.",
                severity: "error",
                ruleId: "b"
            }
        ]);
    });

    it("lists the team warnings before the rule lines", () => {
        const step = stepWith([createRuleValue({ id: "a", target: null })]);
        const teams = [createWorkflowTeamSummary({ id: "team-1", name: "Legal", memberCount: 0 })];

        const lines = getStepWarnings(step, context({ teams, references }));

        expect(lines.map(line => line.text)).toEqual([
            "Legal has no members.",
            "Rule 1: Choose who this rule assigns to."
        ]);
        expect(lines.map(line => line.severity)).toEqual(["warning", "error"]);
        expect(lines[0].ruleId).toBeUndefined();
    });

    it("follows the rule's current position", () => {
        const first = createRuleValue({ id: "a", target: null });
        const second = createRuleValue({ id: "b" });

        const before = getStepWarnings(stepWith([first, second]), context());
        const after = getStepWarnings(stepWith([second, first]), context());

        expect(before.map(line => line.text)).toEqual(["Rule 1: Choose who this rule assigns to."]);
        expect(after.map(line => line.text)).toEqual(["Rule 2: Choose who this rule assigns to."]);
    });
});

describe("getStepWarnings: teams off (R309)", () => {
    it("has the single teams-off line for a People step, whatever else is wrong", () => {
        const assignment = assignmentToConfig(
            createAssignmentValue({ rules: [createRuleValue({ id: "a", target: null })] })
        );
        const step = createReviewStep({ config: { teams: ["team-1"], assignment } });
        const teams = [createWorkflowTeamSummary({ id: "team-1", name: "Legal", memberCount: 0 })];

        const lines = getStepWarnings(step, context({ teams, reviewAvailable: false }));

        expect(lines).toEqual([warning(TEAMS_OFF_STEP_MESSAGE)]);
        expect(TEAMS_OFF_STEP_MESSAGE).toBe(
            "This step needs teams, which are not enabled. It can't be edited."
        );
    });

    it("leaves the Automation and AI steps alone", () => {
        const off = context({ reviewAvailable: false });

        const automation = getStepWarnings(createAutomationStep(), off);
        const ai = getStepWarnings(createAiStep(), off);

        expect(automation).toEqual([]);
        expect(ai).toEqual([]);
    });
});
