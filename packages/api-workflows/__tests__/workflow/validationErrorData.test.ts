import { describe, expect, it } from "vitest";
import zod from "zod";
import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/feature/api";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { WorkflowValidationError } from "~/domain/workflow/errors.js";
import type { WorkflowValidationErrorData } from "~/domain/workflow/errors.js";
import { WorkflowValidator } from "~/domain/workflow/WorkflowValidator.js";
import type { WorkflowStep, WorkflowValues } from "~/domain/workflow/types.js";
import { AutomationDefinition } from "~/features/automation/AutomationDefinition/index.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { FakeListUsers, type FakeUser } from "~tests/__helpers/FakeListUsers.js";
import {
    createAutomationStep,
    registerTestAutomation,
    TEST_AUTOMATION_ID
} from "~tests/__helpers/TestAutomationDefinition.js";
import {
    createReviewStep,
    createWorkflowValues,
    editor,
    expectOk,
    REVIEW_TEAM_ID
} from "~tests/__helpers/fixtures.js";

const MEMBER_ID = "user-member";
const OUTSIDER_ID = "user-outsider";

const USERS: FakeUser[] = [
    { id: MEMBER_ID, displayName: "Mia Member", teams: [REVIEW_TEAM_ID] },
    { id: OUTSIDER_ID, displayName: "Otto Outsider", teams: ["team-x"] }
];

/** Settings with a nested path. */
class NestedSettingsAutomation implements AutomationDefinition.Interface {
    public readonly id = "nested-automation";
    public readonly name = "Nested automation";
    public readonly models = ["*"];
    public readonly settingsSchema = zod.object({ target: zod.object({ url: zod.url() }) });

    public async run(): Promise<AutomationDefinition.Outcome> {
        return { type: "approved" };
    }
}

/** Settings whose issue has no path: an unknown key on the root object. */
class StrictSettingsAutomation implements AutomationDefinition.Interface {
    public readonly id = "strict-automation";
    public readonly name = "Strict automation";
    public readonly models = ["*"];
    public readonly settingsSchema = zod.strictObject({});

    public async run(): Promise<AutomationDefinition.Outcome> {
        return { type: "approved" };
    }
}

const workflowLevel = (field: string): WorkflowValidationErrorData => {
    return { stepId: null, field, workflowId: null };
};

const stepLevel = (stepId: string, field: string): WorkflowValidationErrorData => {
    return { stepId, field, workflowId: null };
};

const customStep = (type: string, title: string): WorkflowStep => {
    return {
        id: `step-${type}`,
        title,
        color: "",
        type,
        notifications: [],
        config: { anything: true }
    };
};

const reviewStepWithConfig = (config: unknown): WorkflowStep => {
    return { ...createReviewStep({ id: "legal", title: "Legal review" }), config };
};

const setup = async (register: (container: Container) => void = () => {}) => {
    const { context } = await createContextHandler({
        setup: container => {
            container.registerInstance(ListUsersUseCase, new FakeListUsers(USERS));
            register(container);
        }
    });
    const store = context.container.resolve(StoreWorkflowUseCase);
    return {
        store: (workflow: WorkflowValues) => {
            return store.execute({ workflow, actor: editor });
        }
    };
};

describe("WorkflowValidationError data (R267)", () => {
    it("defaults every key to null", () => {
        const error = new WorkflowValidationError("Nope.");

        expect(error.code).toBe("Workflows/Workflow/Validation");
        expect(error.data).toEqual({ stepId: null, field: null, workflowId: null });
    });

    it("keeps the keys it is given and nulls the rest", () => {
        const error = new WorkflowValidationError("Nope.", { stepId: "legal", field: "title" });

        expect(error.data).toEqual({ stepId: "legal", field: "title", workflowId: null });
    });

    it("has no field for the workflow id, which the editor generates", () => {
        const result = WorkflowValidator.validate(createWorkflowValues({ id: "" }), step => {
            return Result.ok(step);
        });

        expect(result.error.message).toBe("Workflow ID is required.");
        expect(result.error.data).toEqual({ stepId: null, field: null, workflowId: null });
    });
});

describe("StoreWorkflowUseCase: workflow-level validation errors point at name, models or steps", () => {
    it("marks a blank name", async () => {
        const { store } = await setup();

        const result = await store(createWorkflowValues({ name: "  " }));

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.data).toEqual(workflowLevel("name"));
    });

    it("marks a model count other than one", async () => {
        const { store } = await setup();

        const none = await store(createWorkflowValues({ models: [] }));
        const two = await store(createWorkflowValues({ models: ["cms.a", "cms.b"] }));

        expect(none.error.data).toEqual(workflowLevel("models"));
        expect(two.error.data).toEqual(workflowLevel("models"));
    });

    it("marks a model id that is not a namespace id", async () => {
        const { store } = await setup();

        const result = await store(createWorkflowValues({ models: ["foo"] }));

        expect(result.error.data).toEqual(workflowLevel("models"));
    });

    it("marks a workflow with no steps", async () => {
        const { store } = await setup();

        const result = await store(createWorkflowValues({ steps: [] }));

        expect(result.error.message).toBe("Add at least one step.");
        expect(result.error.data).toEqual(workflowLevel("steps"));
    });

    it("marks a step with no id as a steps problem, with no step", async () => {
        const { store } = await setup();
        const step = { ...createReviewStep({ id: "legal", title: "Legal review" }), id: "" };

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.message).toBe("Every step needs an ID.");
        expect(result.error.data).toEqual(workflowLevel("steps"));
    });

    it("names the other workflow when the model already has one, with the same code and message", async () => {
        const { store } = await setup();
        expectOk(await store(createWorkflowValues()));

        const result = await store(createWorkflowValues({ id: "workflow-2", name: "Second" }));

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            'The model "cms.article" already has a workflow: "Article review".'
        );
        expect(result.error.data).toEqual({
            stepId: null,
            field: "models",
            workflowId: "workflow-1"
        });
    });
});

describe("StoreWorkflowUseCase: step-level validation errors point at the step and field", () => {
    it("marks a step id used twice with the id field", async () => {
        const { store } = await setup();
        const steps = [
            createReviewStep({ id: "legal", title: "Legal review" }),
            createReviewStep({ id: "legal", title: "Second review" })
        ];

        const result = await store(createWorkflowValues({ steps }));

        expect(result.error.data).toEqual(stepLevel("legal", "id"));
    });

    it("marks a blank title", async () => {
        const { store } = await setup();
        const steps = [
            createReviewStep({ id: "legal", title: "Legal review" }),
            createReviewStep({ id: "editorial", title: "  " })
        ];

        const result = await store(createWorkflowValues({ steps }));

        expect(result.error.data).toEqual(stepLevel("editorial", "title"));
    });

    it("marks an unknown step type and an unavailable ai type with the type field", async () => {
        const { store } = await setup();

        const unknown = await store(
            createWorkflowValues({ steps: [customStep("webhook", "Notify")] })
        );
        const ai = await store(createWorkflowValues({ steps: [customStep("ai", "AI check")] }));

        expect(unknown.error.data).toEqual(stepLevel("step-webhook", "type"));
        expect(ai.error.data).toEqual(stepLevel("step-ai", "type"));
    });
});

describe("StoreWorkflowUseCase: review step errors", () => {
    it("marks a routing rule with no target", async () => {
        const { store } = await setup();
        const step = createReviewStep({
            id: "legal",
            title: "Legal review",
            rules: [{ id: "rule-1", conditions: {} }]
        });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.data).toEqual(stepLevel("legal", "config.assignment.rules"));
    });

    it("marks a step with no team", async () => {
        const { store } = await setup();
        const step = createReviewStep({ id: "legal", title: "Legal review", teams: [] });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.data).toEqual(stepLevel("legal", "config.teams"));
    });

    it("marks a team target outside the step's teams", async () => {
        const { store } = await setup();
        const step = createReviewStep({
            id: "legal",
            title: "Legal review",
            rules: [
                {
                    id: "rule-1",
                    conditions: {},
                    target: { type: "team", id: "team-elsewhere" }
                }
            ]
        });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.data).toEqual(stepLevel("legal", "config.assignment.rules"));
    });

    it("marks a user target who is not a member of the step's teams", async () => {
        const { store } = await setup();
        const step = createReviewStep({
            id: "legal",
            title: "Legal review",
            rules: [{ id: "rule-1", conditions: {}, target: { type: "user", id: OUTSIDER_ID } }]
        });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.message).toBe(
            "Rule rule-1 targets a user who is not a member of the step's teams."
        );
        expect(result.error.data).toEqual(stepLevel("legal", "config.assignment.rules"));
    });

    it("marks a config issue with the zod issue path", async () => {
        const { store } = await setup();
        const step = reviewStepWithConfig({
            teams: [REVIEW_TEAM_ID],
            assignment: { strategy: "bogus", allowManualPick: false, rules: [] }
        });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.data).toEqual(stepLevel("legal", "config.assignment.strategy"));
    });

    it("marks a config that is not an object with config", async () => {
        const { store } = await setup();
        const step = reviewStepWithConfig("nope");

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.data).toEqual(stepLevel("legal", "config"));
    });
});

describe("StoreWorkflowUseCase: automation step errors", () => {
    it("marks a config with no settings as an automation problem", async () => {
        const { store } = await setup(container => registerTestAutomation(container));
        const step = {
            ...createAutomationStep({ id: "notify", title: "Notify" }),
            config: { automationId: TEST_AUTOMATION_ID }
        };

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.message).toBe('Step "Notify" needs an automation.');
        expect(result.error.data).toEqual(stepLevel("notify", "config.automationId"));
    });

    it("marks an automation that is not defined", async () => {
        const { store } = await setup();
        const step = createAutomationStep({ id: "notify", title: "Notify" });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.data).toEqual(stepLevel("notify", "config.automationId"));
    });

    it("marks an automation that does not cover the workflow's model", async () => {
        const { store } = await setup(container => {
            registerTestAutomation(container, { models: ["wb.page"] });
        });
        const step = createAutomationStep({ id: "notify", title: "Notify" });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.data).toEqual(stepLevel("notify", "config.automationId"));
    });

    it("marks invalid settings with the settings path", async () => {
        const { store } = await setup(container => registerTestAutomation(container));
        const step = createAutomationStep({
            id: "notify",
            title: "Notify",
            settings: { mode: "explode" }
        });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.message).toMatch(/^Step "Notify" settings are not valid: mode: .+\.$/);
        expect(result.error.data).toEqual(stepLevel("notify", "config.settings.mode"));
    });

    it("marks a nested settings issue with the dotted path", async () => {
        const { store } = await setup(container => {
            container.registerInstance(
                AutomationDefinition,
                new NestedSettingsAutomation() as AutomationDefinition.Interface
            );
        });
        const step = createAutomationStep({
            id: "notify",
            title: "Notify",
            automationId: "nested-automation",
            settings: { target: { url: "nope" } }
        });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.data).toEqual(stepLevel("notify", "config.settings.target.url"));
    });

    it("marks a settings issue with no path with config.settings and keeps the message", async () => {
        const { store } = await setup(container => {
            container.registerInstance(
                AutomationDefinition,
                new StrictSettingsAutomation() as AutomationDefinition.Interface
            );
        });
        const step = createAutomationStep({
            id: "notify",
            title: "Notify",
            automationId: "strict-automation",
            settings: { extra: 1 }
        });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.message).toMatch(/^Step "Notify" settings are not valid: .+\.$/);
        expect(result.error.data).toEqual(stepLevel("notify", "config.settings"));
    });
});
