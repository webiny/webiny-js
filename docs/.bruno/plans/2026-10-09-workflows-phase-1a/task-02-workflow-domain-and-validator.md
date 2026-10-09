### Task 2: Workflow domain types, review step config schema and validator

**Files:**
- Create: `packages/api-workflows/src/domain/workflow/types.ts`
- Create: `packages/api-workflows/src/domain/workflow/reviewStepConfigSchema.ts`
- Create: `packages/api-workflows/src/domain/workflow/WorkflowValidator.ts`
- Create: `packages/api-workflows/__tests__/__helpers/fixtures.ts`
- Create: `packages/api-workflows/__tests__/domain/WorkflowValidator.test.ts`

**Interfaces:**
- Consumes: `WorkflowValidationError` (`~/domain/workflow/errors.js`, existing, constructor `(message: string)`, code `Workflows/Workflow/Validation`), `Result` (`@webiny/feature/api`), `zod`.
- Produces:
  - Types `Workflow`, `WorkflowValues`, `WorkflowStep`, `WorkflowStepNotification`, `WorkflowIdentity`, `ReviewStepConfig`, `ReviewStepAssignmentConfig`, `RoutingRule`, `RoutingRuleConditions`, `RoutingRuleFolderCondition`, `RoutingRuleTarget`, `RoutingStrategy`, `RoutingRuleTargetType`.
  - `reviewStepConfigSchema` (zod) and `parseReviewStepConfig(config: unknown): ReviewStepConfig | null`.
  - `REVIEW_STEP_TYPE = "review"`, `WorkflowValidator.validate(values: WorkflowValues): Result<WorkflowValues, WorkflowValidationError>`.

- [ ] **Step 1: Write the test fixtures**

Create `packages/api-workflows/__tests__/__helpers/fixtures.ts`:

```ts
import type { WorkflowStep, WorkflowValues } from "~/domain/workflow/types.js";

export const NOW = "2026-10-09T10:00:00.000Z";
export const REVIEW_TEAM_ID = "team-reviewers";
export const OTHER_TEAM_ID = "team-other";
export const ARTICLE_MODEL = "cms.article";

export interface ReviewStepFixtureParams {
    id: string;
    title: string;
    teams?: string[];
    allowManualPick?: boolean;
    rules?: unknown[];
}

export const createReviewStep = (params: ReviewStepFixtureParams): WorkflowStep => {
    return {
        id: params.id,
        title: params.title,
        color: "#3b82f6",
        type: "review",
        notifications: [],
        config: {
            teams: params.teams ?? [REVIEW_TEAM_ID],
            assignment: {
                strategy: "none",
                allowManualPick: params.allowManualPick ?? false,
                rules: params.rules ?? []
            }
        }
    };
};

export const createWorkflowValues = (overrides: Partial<WorkflowValues> = {}): WorkflowValues => {
    return {
        id: "workflow-1",
        name: "Article review",
        models: [ARTICLE_MODEL],
        steps: [
            createReviewStep({ id: "legal", title: "Legal review", allowManualPick: true }),
            createReviewStep({ id: "editorial", title: "Editorial review" })
        ],
        ...overrides
    };
};
```

- [ ] **Step 2: Write the failing test**

Create `packages/api-workflows/__tests__/domain/WorkflowValidator.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { WorkflowValidator } from "~/domain/workflow/WorkflowValidator.js";
import type { WorkflowValues } from "~/domain/workflow/types.js";
import { createReviewStep, createWorkflowValues } from "~tests/__helpers/fixtures.js";

const validationMessage = (values: WorkflowValues): string => {
    const result = WorkflowValidator.validate(values);
    if (result.isOk()) {
        throw new Error("Expected the workflow to be invalid.");
    }
    expect(result.error.code).toBe("Workflows/Workflow/Validation");
    return result.error.message;
};

describe("WorkflowValidator", () => {
    it("accepts a workflow with review steps", () => {
        const values = createWorkflowValues();

        const result = WorkflowValidator.validate(values);

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual(values);
    });

    it("requires a name", () => {
        expect(validationMessage(createWorkflowValues({ name: "  " }))).toBe(
            "Workflow name is required."
        );
    });

    it("requires exactly one model", () => {
        const expected = "A workflow must be bound to exactly one model.";
        expect(validationMessage(createWorkflowValues({ models: [] }))).toBe(expected);
        expect(validationMessage(createWorkflowValues({ models: ["cms.a", "cms.b"] }))).toBe(
            expected
        );
    });

    it("requires at least one step", () => {
        expect(validationMessage(createWorkflowValues({ steps: [] }))).toBe(
            "Add at least one step."
        );
    });

    it("requires unique step ids", () => {
        const steps = [
            createReviewStep({ id: "legal", title: "Legal review" }),
            createReviewStep({ id: "legal", title: "Second legal review" })
        ];

        expect(validationMessage(createWorkflowValues({ steps }))).toBe(
            'Step ID "legal" is used more than once.'
        );
    });

    it("accepts only review steps until step types are pluggable", () => {
        const steps = [{ ...createReviewStep({ id: "ai", title: "AI check" }), type: "ai" }];

        expect(validationMessage(createWorkflowValues({ steps }))).toBe(
            'Step "AI check" uses the step type "ai", which is not supported yet. Only "review" steps can be saved.'
        );
    });

    it("requires at least one team on a review step", () => {
        const steps = [createReviewStep({ id: "legal", title: "Legal review", teams: [] })];

        expect(validationMessage(createWorkflowValues({ steps }))).toBe(
            'Step "Legal review" needs at least one team.'
        );
    });

    it("requires a target on every routing rule", () => {
        const steps = [
            createReviewStep({
                id: "legal",
                title: "Legal review",
                rules: [{ id: "rule-1", conditions: {} }]
            })
        ];

        expect(validationMessage(createWorkflowValues({ steps }))).toBe(
            'Every routing rule in step "Legal review" needs a target.'
        );
    });

    it("rejects an invalid review config", () => {
        const step = createReviewStep({ id: "legal", title: "Legal review" });
        const steps = [
            {
                ...step,
                config: {
                    teams: ["team-a"],
                    assignment: { strategy: "random", allowManualPick: false, rules: [] }
                }
            }
        ];

        expect(validationMessage(createWorkflowValues({ steps }))).toMatch(
            /^Step "Legal review" has an invalid configuration: /
        );
    });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/domain/WorkflowValidator.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/domain/workflow/WorkflowValidator.js`.

- [ ] **Step 4: Add the workflow domain types**

Create `packages/api-workflows/src/domain/workflow/types.ts`:

```ts
export interface WorkflowStepNotification {
    /** Notification transport id, e.g. "e-mail" (D44). */
    id: string;
}

export interface WorkflowStep {
    id: string;
    title: string;
    color: string;
    description?: string;
    /** Step type id. Phase 1a accepts only "review" (R7). */
    type: string;
    notifications: WorkflowStepNotification[];
    /** Validated by the step type's schema; for "review" see `ReviewStepConfig`. */
    config: unknown;
}

export interface WorkflowValues {
    id: string;
    name: string;
    /** Namespace ids, e.g. `["cms.article"]`; exactly one in v1 (D15). */
    models: string[];
    steps: WorkflowStep[];
}

export interface WorkflowIdentity {
    id: string;
    displayName: string;
    type: string;
}

export interface Workflow extends WorkflowValues {
    createdOn: string;
    savedOn: string;
    createdBy: WorkflowIdentity;
    savedBy: WorkflowIdentity;
}

export type RoutingStrategy = "none" | "roundRobin" | "leastLoaded";

export type RoutingRuleTargetType = "user" | "team";

export interface RoutingRuleFolderCondition {
    id: string;
    type: string;
    includeDescendants: boolean;
}

export interface RoutingRuleConditions {
    requesterUserId?: string;
    requesterTeamId?: string;
    folder?: RoutingRuleFolderCondition;
    modelId?: string;
}

export interface RoutingRuleTarget {
    type: RoutingRuleTargetType;
    id: string;
}

export interface RoutingRule {
    id: string;
    conditions: RoutingRuleConditions;
    target: RoutingRuleTarget;
}

export interface ReviewStepAssignmentConfig {
    strategy: RoutingStrategy;
    allowManualPick: boolean;
    /** Ordered; first match wins (spec 6). */
    rules: RoutingRule[];
}

export interface ReviewStepConfig {
    /** Team ids; at least one. */
    teams: string[];
    assignment: ReviewStepAssignmentConfig;
}
```

- [ ] **Step 5: Add the review step config schema**

Create `packages/api-workflows/src/domain/workflow/reviewStepConfigSchema.ts`:

```ts
import zod from "zod";
import type { ReviewStepConfig } from "./types.js";

const routingRuleFolderConditionSchema = zod.object({
    id: zod.string().min(1, "Folder ID is required."),
    type: zod.string().min(1, "Folder type is required."),
    includeDescendants: zod.boolean()
});

const routingRuleSchema = zod.object({
    id: zod.string().min(1, "Rule ID is required."),
    conditions: zod.object({
        requesterUserId: zod.string().min(1).optional(),
        requesterTeamId: zod.string().min(1).optional(),
        folder: routingRuleFolderConditionSchema.optional(),
        modelId: zod.string().min(1).optional()
    }),
    target: zod.object({
        type: zod.enum(["user", "team"]),
        id: zod.string().min(1, "Rule target ID is required.")
    })
});

/**
 * Config of a "review" step (spec 4.1). Validated in code until phase 5 adds the `StepType`
 * extension point; stored as JSON on the workflow and review models.
 */
export const reviewStepConfigSchema = zod.object({
    teams: zod.array(zod.string().min(1, "Team ID is required.")),
    assignment: zod.object({
        strategy: zod.enum(["none", "roundRobin", "leastLoaded"]),
        allowManualPick: zod.boolean(),
        rules: zod.array(routingRuleSchema)
    })
});

/** Parses a stored review step config; `null` when it does not match the schema. */
export const parseReviewStepConfig = (config: unknown): ReviewStepConfig | null => {
    const result = reviewStepConfigSchema.safeParse(config);
    return result.success ? result.data : null;
};
```

- [ ] **Step 6: Add the validator**

Create `packages/api-workflows/src/domain/workflow/WorkflowValidator.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { WorkflowValidationError } from "./errors.js";
import { reviewStepConfigSchema } from "./reviewStepConfigSchema.js";
import type { ReviewStepConfig, WorkflowStep, WorkflowValues } from "./types.js";

/** The only step type phase 1a accepts; phase 5 replaces this check with the `StepType` registry. */
export const REVIEW_STEP_TYPE = "review";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const fail = (message: string) => {
    return Result.fail(new WorkflowValidationError(message));
};

/**
 * Validates a workflow on create and update (one path, spec 4.1, D41, D108). Checks that need
 * storage (model already bound to another workflow) live in `StoreWorkflowUseCase`; the "model is
 * publishable" check is a `WorkflowBeforeCreate` / `WorkflowBeforeUpdate` handler in the CMS
 * workflows package.
 */
export class WorkflowValidator {
    public static validate(values: WorkflowValues): Result<WorkflowValues, WorkflowValidationError> {
        if (!values.id) {
            return fail("Workflow ID is required.");
        }
        if (!values.name || !values.name.trim()) {
            return fail("Workflow name is required.");
        }
        if (values.models.length !== 1 || !values.models[0]) {
            return fail("A workflow must be bound to exactly one model.");
        }
        if (values.steps.length === 0) {
            return fail("Add at least one step.");
        }

        const stepIds = new Set<string>();
        const steps: WorkflowStep[] = [];
        for (const step of values.steps) {
            const result = WorkflowValidator.validateStep(step, stepIds);
            if (result.isFail()) {
                return Result.fail(result.error);
            }
            steps.push(result.value);
        }

        return Result.ok({
            id: values.id,
            name: values.name.trim(),
            models: [...values.models],
            steps
        });
    }

    private static validateStep(
        step: WorkflowStep,
        stepIds: Set<string>
    ): Result<WorkflowStep, WorkflowValidationError> {
        if (!step.id) {
            return fail("Every step needs an ID.");
        }
        if (stepIds.has(step.id)) {
            return fail(`Step ID "${step.id}" is used more than once.`);
        }
        stepIds.add(step.id);

        if (!step.title || !step.title.trim()) {
            return fail(`Step "${step.id}" needs a title.`);
        }
        if (step.type !== REVIEW_STEP_TYPE) {
            return fail(
                `Step "${step.title}" uses the step type "${step.type}", which is not supported yet. Only "review" steps can be saved.`
            );
        }

        const config = WorkflowValidator.validateReviewConfig(step);
        if (config.isFail()) {
            return Result.fail(config.error);
        }

        return Result.ok({
            ...step,
            notifications: step.notifications ?? [],
            config: config.value
        });
    }

    private static validateReviewConfig(
        step: WorkflowStep
    ): Result<ReviewStepConfig, WorkflowValidationError> {
        const config: UnknownRecord = isRecord(step.config) ? step.config : {};
        const teams = Array.isArray(config.teams) ? config.teams : [];
        if (teams.length === 0) {
            return fail(`Step "${step.title}" needs at least one team.`);
        }

        const assignment: UnknownRecord = isRecord(config.assignment) ? config.assignment : {};
        const rules = Array.isArray(assignment.rules) ? assignment.rules : [];
        for (const rule of rules) {
            if (!isRecord(rule) || !isRecord(rule.target)) {
                return fail(`Every routing rule in step "${step.title}" needs a target.`);
            }
        }

        const parsed = reviewStepConfigSchema.safeParse(step.config);
        if (!parsed.success) {
            const [issue] = parsed.error.issues;
            return fail(
                `Step "${step.title}" has an invalid configuration: ${issue?.message ?? "unknown error"}`
            );
        }

        return Result.ok(parsed.data);
    }
}
```

- [ ] **Step 7: Run the test**

Run: `yarn test packages/api-workflows/__tests__/domain/WorkflowValidator.test.ts 2>&1 | tail -50`
Expected: PASS (9 tests).
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then:

```bash
git commit -m "feat(api-workflows): add workflow domain types and validator

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
