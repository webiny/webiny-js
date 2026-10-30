### Task 12: Draft validation, step summary and warnings

R299, R304, R308, R309, R312; Q50, Q53, Q58; Review Focus 1, 5; design README 4.7 (card summary, `Rule {n}:` lines). `validateWorkflowDraft`, `getStepSummary` and `getStepWarnings` learn about rules and about teams off. All three stay pure.

- **`validateWorkflowDraft` (R304):** `ValidateWorkflowDraftParams` gains `references: RuleReferences` and `reviewAvailable: boolean`. For a People step the existing check stays (`Choose at least one reviewing team.`, field `config.teams`) and the **error** issues of `getRuleIssues` are added, each as `{ field: "config.assignment.rules.target", message, ruleId }` in rule order (warnings are never added). For a People step while the `review` step type is unavailable (teams off) the type check returns nothing at all: a saved step is read-only, its rules are saved untouched and never block Save (R290, R304). The shared checks of every step (title, colour) still run, as they do for an AI step without the AI editor. `StepFieldError` gains the optional `ruleId?: string | null`; Task 15 makes it a required `string | null` and fills it for server errors.
- **`StepContext`** gains `references: RuleReferences` and `reviewAvailable: boolean`. The presenter keeps passing `createEmptyRuleReferences()` (no reference issue can arise from it) until Task 14 passes the resolved references.
- **`isReviewAvailable(stepTypes)`:** false only when `listStepTypes` lists the `review` row as not available (R290); a missing row (the list did not load) is available, so a failed list never locks People steps. The presenter uses it for both `reviewAvailable` values. Task 16 reuses it for `isStepReadOnly`.
- **`getStepSummary` (R308):** `{Teams joined with +} · {Team pool|Round-robin|Least-loaded}[ · 1 routing rule | · {n} routing rules][ · requester can pick]`. An unknown stored strategy (`strategy: null`) omits the strategy part. Empty with no teams (as in 9a) and empty for a People step of an unavailable `review` row.
- **`getStepWarnings` (R299, R309, R312; controller ruling on severity):** it returns `StepWarningLine[]` (`{ text: string; severity: "error" | "warning"; ruleId?: string }`, new file `model/StepWarningLine.ts`) instead of strings, so the card can render a live rule error destructive and a warning amber. For a People step the existing `{Team} has no members.` lines first (severity `warning`), then one line per rule issue of either kind, in rule order, prefixed `Rule {n}: ` (severity is the issue's kind, `ruleId` is the issue's rule id; live errors show on the step card and in the drawer top as soon as they are computed). For a People step of an unavailable `review` row the single line `This step needs teams, which are not enabled. It can't be edited.` (severity `warning`, the constant `TEAMS_OFF_STEP_MESSAGE`, shared with the drawer notice of Task 16) and nothing else. Automation and AI lines keep their text with severity `warning`. A server error for a rule replaces the live error line of that rule (no double line): the optional `ruleId` on the line is what lets the card (Task 24) and the drawer (Task 16) drop the live line of a rule that has a server error. This task keeps the card view model's `warnings: string[]` fed from the lines' text (the presenter hunk below); Task 24 passes the severity on.

**Files:**
- Create: `packages/app-workflows/src/editor/model/isReviewAvailable.ts`
- Create: `packages/app-workflows/src/editor/model/teamsOffMessage.ts`
- Create: `packages/app-workflows/src/editor/model/StepWarningLine.ts`
- Create: `packages/app-workflows/src/editor/model/isReviewAvailable.test.ts`
- Modify: `packages/app-workflows/src/editor/model/StepFieldError.ts`
- Modify: `packages/app-workflows/src/editor/model/StepContext.ts`
- Modify: `packages/app-workflows/src/editor/model/validateWorkflowDraft.ts`
- Modify: `packages/app-workflows/src/editor/model/getStepSummary.ts`
- Modify: `packages/app-workflows/src/editor/model/getStepWarnings.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts` (the save call, `getStepContext` and `buildFlow`)
- Modify: `packages/app-workflows/src/editor/model/validateWorkflowDraft.test.ts`
- Modify: `packages/app-workflows/src/editor/model/getStepSummary.test.ts`
- Modify: `packages/app-workflows/src/editor/model/getStepWarnings.test.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.flow.test.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.teamSearch.test.ts`

**Interfaces:**
- Consumes: Task 9 (`readAssignment`, `assignmentToConfig`, `AssignmentStrategy`, `createRuleValue`, `createAssignmentValue`), Task 11 (`RuleReferences`, `createEmptyRuleReferences`, `getRuleIssues`, `createRuleReferences`, `createReferenceLabel`), existing `readReviewConfig`, `StepTypeId`, `WorkflowDraft`, `toStepInput`.
- Produces: the extended `ValidateWorkflowDraftParams { name; steps; automations; aiEditable; references: RuleReferences; reviewAvailable: boolean }` and `StepContext` (`references`, `reviewAvailable`), `StepFieldError.ruleId?: string | null`, `isReviewAvailable(stepTypes: EditorStepType[]): boolean`, `TEAMS_OFF_STEP_MESSAGE`, `StepWarningLine { text: string; severity: "error" | "warning"; ruleId?: string }`, `getStepSummary(step, context): string`, `getStepWarnings(step, context): StepWarningLine[]` (the return type changes from `string[]`; consumers: `WorkflowEditorPresenter.buildFlow` here, the `StepDrawerSource.getStepWarnings` accessor of Task 16 and the card of Task 24).

**Test runner note:** admin package, `yarn test <path>` only. Plain `.ts` tests.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/model/isReviewAvailable.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createEditorStepType } from "~/editor/testing/editorFixtures.js";
import { isReviewAvailable } from "./isReviewAvailable.js";

describe("isReviewAvailable (R290)", () => {
    it("is true when the review row is available", () => {
        expect(isReviewAvailable([createEditorStepType({ type: "review" })])).toBe(true);
    });

    it("is false when the review row is listed as not available", () => {
        const types = [
            createEditorStepType({
                type: "review",
                available: false,
                unavailableReason: "Teams are not enabled."
            })
        ];

        expect(isReviewAvailable(types)).toBe(false);
    });

    it("is true when the list has no review row (the list did not load)", () => {
        expect(isReviewAvailable([])).toBe(true);
        expect(isReviewAvailable([createEditorStepType({ type: "ai", available: false })])).toBe(
            true
        );
    });
});
```

Modify `packages/app-workflows/src/editor/model/validateWorkflowDraft.test.ts`. Replace the import block and the `params` helper (everything from the first line down to and including the closing `};` of `params`):

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { validateWorkflowDraft } from "./validateWorkflowDraft.js";
import type { ValidateWorkflowDraftParams } from "./validateWorkflowDraft.js";

const params = (
    overrides: Partial<ValidateWorkflowDraftParams> = {}
): ValidateWorkflowDraftParams => {
    return {
        name: "Article review",
        steps: [createReviewStep()],
        automations: [createWebhookAutomation()],
        aiEditable: true,
        ...overrides
    };
};
```

with:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createAssignmentValue } from "~/editor/testing/ruleFixtures.js";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { createRuleReferences } from "~/editor/testing/ruleFixtures.js";
import { createRuleValue } from "~/editor/testing/ruleFixtures.js";
import type { EditorStep } from "~/editor/domain/types.js";
import { assignmentToConfig } from "./assignment/assignmentToConfig.js";
import type { RuleValue } from "./assignment/RuleValue.js";
import { createEmptyRuleReferences } from "./rules/createEmptyRuleReferences.js";
import { toStepInput } from "./toStepInput.js";
import { validateWorkflowDraft } from "./validateWorkflowDraft.js";
import type { ValidateWorkflowDraftParams } from "./validateWorkflowDraft.js";
import { WorkflowDraft } from "./WorkflowDraft.js";

const params = (
    overrides: Partial<ValidateWorkflowDraftParams> = {}
): ValidateWorkflowDraftParams => {
    return {
        name: "Article review",
        steps: [createReviewStep()],
        automations: [createWebhookAutomation()],
        aiEditable: true,
        references: createEmptyRuleReferences(),
        reviewAvailable: true,
        ...overrides
    };
};
```

Then append at the end of the same file:

```ts
const RULE_TARGET_FIELD = "config.assignment.rules.target";

const references = createRuleReferences({
    users: [
        createReferenceLabel({ id: "user-in", label: "Ivan Horvat" }),
        createReferenceLabel({ id: "user-out", label: "Maja Kos" }),
        createReferenceLabel({ id: "user-gone", label: "Deleted user", state: "deleted" })
    ],
    teams: [
        createReferenceLabel({ id: "team-1", label: "Editors" }),
        createReferenceLabel({ id: "team-2", label: "Marketing" }),
        createReferenceLabel({ id: "team-gone", label: "Deleted team", state: "deleted" })
    ],
    folders: [
        createReferenceLabel({ id: "f9", label: "Restricted folder", state: "restricted" }),
        createReferenceLabel({ id: "fx", label: "Deleted folder", state: "deleted" })
    ],
    userTeamIds: { "user-in": ["team-1"], "user-out": ["team-7"] }
});

const stepWithRules = (rules: RuleValue[], teams: string[] = ["team-1"]): EditorStep => {
    const assignment = assignmentToConfig(createAssignmentValue({ rules }));

    return createReviewStep({ config: { teams, assignment } });
};

describe("validateWorkflowDraft: People rules (R299, R304)", () => {
    it("blocks a rule without a target and names the rule", () => {
        const step = stepWithRules([createRuleValue({ id: "a", target: null })]);

        const errors = validateWorkflowDraft(params({ steps: [step], references }));

        expect(errors.stepErrors).toEqual([
            {
                stepId: "step-1",
                errors: [
                    {
                        field: RULE_TARGET_FIELD,
                        message: "Choose who this rule assigns to.",
                        ruleId: "a"
                    }
                ]
            }
        ]);
    });

    it("blocks a user target outside the reviewing teams", () => {
        const rule = createRuleValue({ id: "a", target: { type: "user", id: "user-out" } });

        const errors = validateWorkflowDraft(params({ steps: [stepWithRules([rule])], references }));

        expect(errors.stepErrors[0].errors).toEqual([
            {
                field: RULE_TARGET_FIELD,
                message: "Maja Kos is no longer in the reviewing teams.",
                ruleId: "a"
            }
        ]);
    });

    it("blocks a team target outside the reviewing teams", () => {
        const rule = createRuleValue({ id: "a", target: { type: "team", id: "team-2" } });

        const errors = validateWorkflowDraft(params({ steps: [stepWithRules([rule])], references }));

        expect(errors.stepErrors[0].errors).toEqual([
            {
                field: RULE_TARGET_FIELD,
                message: "Marketing is not a reviewing team.",
                ruleId: "a"
            }
        ]);
    });

    it("blocks a deleted user target and a deleted team target", () => {
        const rules = [
            createRuleValue({ id: "a", target: { type: "user", id: "user-gone" } }),
            createRuleValue({ id: "b", target: { type: "team", id: "team-gone" } })
        ];

        const errors = validateWorkflowDraft(params({ steps: [stepWithRules(rules)], references }));

        expect(errors.stepErrors[0].errors).toEqual([
            {
                field: RULE_TARGET_FIELD,
                message: "The assigned user was deleted.",
                ruleId: "a"
            },
            { field: RULE_TARGET_FIELD, message: "The team was deleted.", ruleId: "b" }
        ]);
    });

    it("lists the missing teams error before the rule errors", () => {
        const rule = createRuleValue({ id: "a", target: null });

        const errors = validateWorkflowDraft(
            params({ steps: [stepWithRules([rule], [])], references })
        );

        expect(errors.stepErrors[0].errors.map(error => error.field)).toEqual([
            "config.teams",
            RULE_TARGET_FIELD
        ]);
        expect(errors.stepErrors[0].errors[0].ruleId).toBeUndefined();
    });

    it("does not block Save on warnings: a deleted folder, a deleted requester team, a restricted folder and a deleted requester user", () => {
        const rules = [
            createRuleValue({
                id: "a",
                folder: { id: "fx", type: "cms:article", includeDescendants: true }
            }),
            createRuleValue({ id: "b", requesterTeamId: "team-gone" }),
            createRuleValue({
                id: "c",
                folder: { id: "f9", type: "cms:article", includeDescendants: false }
            }),
            createRuleValue({ id: "d", requesterUserId: "user-gone" })
        ];

        const errors = validateWorkflowDraft(params({ steps: [stepWithRules(rules)], references }));

        expect(errors.stepErrors).toEqual([]);
    });

    it("does not block a valid rule list", () => {
        const rules = [
            createRuleValue({ id: "a", target: { type: "user", id: "user-in" } }),
            createRuleValue({ id: "b", target: { type: "team", id: "team-1" } })
        ];

        const errors = validateWorkflowDraft(params({ steps: [stepWithRules(rules)], references }));

        expect(errors.stepErrors).toEqual([]);
    });

    it("does not block on a reference that is not resolved", () => {
        const rule = createRuleValue({ id: "a", target: { type: "user", id: "user-unknown" } });

        const errors = validateWorkflowDraft(
            params({ steps: [stepWithRules([rule])], references: createEmptyRuleReferences() })
        );

        expect(errors.stepErrors).toEqual([]);
    });
});

describe("validateWorkflowDraft: teams off (R290, R304, Review Focus 5)", () => {
    const staleRules = [
        createRuleValue({
            id: "a",
            folder: { id: "fx", type: "cms:article", includeDescendants: true },
            target: { type: "user", id: "user-gone" }
        }),
        createRuleValue({ id: "b", target: { type: "team", id: "team-gone" } }),
        createRuleValue({ id: "c", target: null })
    ];

    it("never blocks Save for a People step while the review type is unavailable", () => {
        const errors = validateWorkflowDraft(
            params({
                steps: [stepWithRules(staleRules), stepWithRules([], [])],
                references,
                reviewAvailable: false
            })
        );

        expect(errors).toEqual({ name: null, steps: null, stepErrors: [] });
    });

    it("saves a People step with a user target, a team target and a deleted folder unchanged", () => {
        const stored = createReviewStep({
            config: {
                teams: ["team-1"],
                assignment: {
                    strategy: "roundRobin",
                    allowManualPick: true,
                    rules: [
                        {
                            id: "r1",
                            conditions: {
                                folder: { id: "fx", type: "cms:article", includeDescendants: true }
                            },
                            target: { type: "user", id: "user-9" }
                        },
                        { id: "r2", conditions: {}, target: { type: "team", id: "team-9" } }
                    ]
                }
            }
        });
        const draft = new WorkflowDraft();
        draft.reset(createEditorWorkflow({ steps: [stored] }));

        const errors = validateWorkflowDraft(
            params({ steps: draft.steps, references, reviewAvailable: false })
        );

        expect(errors.stepErrors).toEqual([]);
        expect(draft.toInput().steps[0]).toEqual(toStepInput(stored));
        expect(draft.toInput().steps[0].config).toEqual(stored.config);
    });

    it("keeps the shared checks and the other step types working", () => {
        const errors = validateWorkflowDraft(
            params({
                steps: [
                    createReviewStep({ title: " " }),
                    createAutomationStep({
                        config: { automationId: "send-webhook", settings: {} }
                    }),
                    createAiStep({
                        config: { instructions: "", model: "openai/gpt-4o", tools: [] }
                    })
                ],
                references,
                reviewAvailable: false
            })
        );

        expect(errors.stepErrors.map(entry => entry.stepId)).toEqual(["step-1", "step-2", "step-3"]);
        expect(errors.stepErrors[0].errors.map(error => error.field)).toEqual(["title"]);
        expect(errors.stepErrors[1].errors.map(error => error.field)).toEqual(["config.settings.url"]);
        expect(errors.stepErrors[2].errors.map(error => error.field)).toEqual([
            "config.instructions"
        ]);
    });
});
```

Modify `packages/app-workflows/src/editor/model/getStepSummary.test.ts`. Replace the imports of fixtures and the `context` helper and the three People tests. First replace

```ts
import { getStepSummary } from "./getStepSummary.js";
import type { StepContext } from "./StepContext.js";

const context = (overrides: Partial<StepContext> = {}): StepContext => {
    return {
        teams: [
            createWorkflowTeamSummary({ id: "team-1", name: "Legal" }),
            createWorkflowTeamSummary({ id: "team-2", name: "Editors" })
        ],
        automations: [createWebhookAutomation()],
        automationsLoaded: true,
        aiModels: [createAiModel()],
        aiTools: [],
        aiEditable: true,
        baselineStep: null,
        ...overrides
    };
};
```

with

```ts
import { createAssignmentValue } from "~/editor/testing/ruleFixtures.js";
import { createRuleValue } from "~/editor/testing/ruleFixtures.js";
import { assignmentToConfig } from "./assignment/assignmentToConfig.js";
import { getStepSummary } from "./getStepSummary.js";
import { createEmptyRuleReferences } from "./rules/createEmptyRuleReferences.js";
import type { StepContext } from "./StepContext.js";

const context = (overrides: Partial<StepContext> = {}): StepContext => {
    return {
        teams: [
            createWorkflowTeamSummary({ id: "team-1", name: "Legal" }),
            createWorkflowTeamSummary({ id: "team-2", name: "Editors" })
        ],
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
```

then replace the whole `describe("getStepSummary: People", ...)` block (from `describe("getStepSummary: People", () => {` through its closing `});` before `describe("getStepSummary: Automation"`) with:

```ts
describe("getStepSummary: People", () => {
    it("joins the team names with + and names the strategy", () => {
        const step = createReviewStep({
            config: { teams: ["team-2", "team-1"], assignment: null }
        });

        expect(getStepSummary(step, context())).toBe("Editors + Legal · Team pool");
    });

    it("names a team that is not known as Unknown item", () => {
        const step = createReviewStep({ config: { teams: ["team-1", "gone"], assignment: null } });

        expect(getStepSummary(step, context())).toBe("Legal + Unknown item · Team pool");
    });

    it("is empty without a team", () => {
        const step = createReviewStep({ config: { teams: [], assignment: null } });

        expect(getStepSummary(step, context())).toBe("");
    });

    it("names each strategy", () => {
        const summary = (strategy: "none" | "roundRobin" | "leastLoaded"): string => {
            const assignment = assignmentToConfig(createAssignmentValue({ strategy }));
            const step = createReviewStep({ config: { teams: ["team-1"], assignment } });

            return getStepSummary(step, context());
        };

        expect(summary("none")).toBe("Legal · Team pool");
        expect(summary("roundRobin")).toBe("Legal · Round-robin");
        expect(summary("leastLoaded")).toBe("Legal · Least-loaded");
    });

    it("counts the routing rules", () => {
        const withRules = (count: number): string => {
            const rules = Array.from({ length: count }, (_, index) => {
                return createRuleValue({ id: `rule-${index}` });
            });
            const assignment = assignmentToConfig(createAssignmentValue({ rules }));
            const step = createReviewStep({ config: { teams: ["team-1"], assignment } });

            return getStepSummary(step, context());
        };

        expect(withRules(0)).toBe("Legal · Team pool");
        expect(withRules(1)).toBe("Legal · Team pool · 1 routing rule");
        expect(withRules(3)).toBe("Legal · Team pool · 3 routing rules");
    });

    it("says requester can pick, after the rules", () => {
        const assignment = assignmentToConfig(
            createAssignmentValue({
                strategy: "leastLoaded",
                allowManualPick: true,
                rules: [createRuleValue({ id: "a" }), createRuleValue({ id: "b" })]
            })
        );
        const step = createReviewStep({ config: { teams: ["team-1", "team-2"], assignment } });

        expect(getStepSummary(step, context())).toBe(
            "Legal + Editors · Least-loaded · 2 routing rules · requester can pick"
        );
    });

    it("leaves the strategy out when the stored one is unknown", () => {
        const step = createReviewStep({
            config: {
                teams: ["team-1"],
                assignment: { strategy: "weighted", allowManualPick: false, rules: [] }
            }
        });

        expect(getStepSummary(step, context())).toBe("Legal");
    });

    it("is empty while the review step type is unavailable (teams off)", () => {
        const step = createReviewStep({ config: { teams: ["team-1"], assignment: null } });

        expect(getStepSummary(step, context({ reviewAvailable: false }))).toBe("");
    });
});
```

Replace the whole of `packages/app-workflows/src/editor/model/getStepWarnings.test.ts` (every assertion now compares `StepWarningLine`s, per the controller ruling on warning severity) with:

```ts
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
```

Modify `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.flow.test.ts`. In `builds a render-ready card with the team name resolved` replace

```ts
                type: "review",
                summary: "Editors",
```

with

```ts
                type: "review",
                summary: "Editors · Team pool",
```

Modify `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.teamSearch.test.ts`. Replace

```ts
        expect(presenter.vm.flow.steps.map(step => step.summary)).toEqual([
            "Editors + Legal",
            "Legal"
        ]);
```

with

```ts
        expect(presenter.vm.flow.steps.map(step => step.summary)).toEqual([
            "Editors + Legal · Team pool",
            "Legal · Team pool"
        ]);
```

In `names a team the server could not find as Unknown item` replace

```ts
        expect(presenter.vm.flow.steps[0].summary).toBe("Unknown item");
        expect(presenter.vm.optionsBanner).toBeNull();
    });

    it("warns about a team without members", async () => {
```

with

```ts
        expect(presenter.vm.flow.steps[0].summary).toBe("Unknown item · Team pool");
        expect(presenter.vm.optionsBanner).toBeNull();
    });

    it("warns about a team without members", async () => {
```

In `shows the names after Try again when the first lookup failed` replace

```ts
        expect(presenter.vm.flow.steps[0].summary).toBe("Unknown item");

        await presenter.retryOptions();

        expect(presenter.vm.flow.steps[0].summary).toBe("Editors");
```

with

```ts
        expect(presenter.vm.flow.steps[0].summary).toBe("Unknown item · Team pool");

        await presenter.retryOptions();

        expect(presenter.vm.flow.steps[0].summary).toBe("Editors · Team pool");
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/model/isReviewAvailable.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/validateWorkflowDraft.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/model/getStepSummary.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/model/getStepWarnings.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.flow.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.teamSearch.test.ts 2>&1 | tail -30
```

Expected: `isReviewAvailable.test.ts` fails with `Failed to resolve import` for `./isReviewAvailable.js`. `getStepWarnings.test.ts` fails with `Failed to resolve import` for `./teamsOffMessage.js`. `validateWorkflowDraft.test.ts`: the new rule cases fail (no rule errors, no `ruleId`, the teams-off cases still report the missing team) while the 9a cases still pass. `getStepSummary.test.ts`: the strategy, rule count and teams-off cases fail and the updated People strings fail (`Editors + Legal` without ` · Team pool`). The two presenter test files fail on the updated summary strings. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/model/teamsOffMessage.ts`:

```ts
// The line a saved People step shows while teams are off: the card warning and the drawer notice (R290, R309, Q59.5).
export const TEAMS_OFF_STEP_MESSAGE =
    "This step needs teams, which are not enabled. It can't be edited.";
```

Create `packages/app-workflows/src/editor/model/isReviewAvailable.ts`:

```ts
import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { EditorStepType } from "~/editor/domain/types.js";

/*
 * False only when `listStepTypes` lists the `review` row as not available (teams are off, R290).
 * A missing row means the list did not load, which must not lock the People steps.
 */
export const isReviewAvailable = (stepTypes: EditorStepType[]): boolean => {
    const row = stepTypes.find(item => item.type === StepTypeId.Review);
    return row === undefined || row.available;
};
```

Modify `packages/app-workflows/src/editor/model/StepFieldError.ts`. Replace

```ts
export interface StepFieldError {
    field: string;
    message: string;
}
```

with

```ts
export interface StepFieldError {
    field: string;
    message: string;
    // The rule a rule-level error belongs to (R288, R299); absent for every other error. Task 15 makes it required.
    ruleId?: string | null;
}
```

Modify `packages/app-workflows/src/editor/model/StepContext.ts`. Replace the imports

```ts
import type { EditorStep } from "~/editor/domain/types.js";
import type { WorkflowTeamSummary } from "~/editor/domain/types.js";
```

with

```ts
import type { EditorStep } from "~/editor/domain/types.js";
import type { WorkflowTeamSummary } from "~/editor/domain/types.js";
import type { RuleReferences } from "./rules/RuleReferences.js";
```

and replace

```ts
    // The step as stored on the server; null for a step added in this session (QBZ-13).
    baselineStep: EditorStep | null;
}
```

with

```ts
    // The step as stored on the server; null for a step added in this session (QBZ-13).
    baselineStep: EditorStep | null;
    // What is resolved for the references of the rules (R298); nothing resolved gives no reference issue.
    references: RuleReferences;
    // False while the `review` step type is unavailable (teams off): a People step is read-only (R290).
    reviewAvailable: boolean;
}
```

Modify `packages/app-workflows/src/editor/model/validateWorkflowDraft.ts`. Replace the import block's last four lines

```ts
import { readReviewConfig } from "./readReviewConfig.js";
import type { StepFieldError } from "./StepFieldError.js";
import type { StepValidationErrors } from "./StepFieldError.js";
import type { WorkflowDraftErrors } from "./StepFieldError.js";
```

with

```ts
import { readAssignment } from "./assignment/readAssignment.js";
import { readReviewConfig } from "./readReviewConfig.js";
import { getRuleIssues } from "./rules/getRuleIssues.js";
import type { RuleReferences } from "./rules/RuleReferences.js";
import type { StepFieldError } from "./StepFieldError.js";
import type { StepValidationErrors } from "./StepFieldError.js";
import type { WorkflowDraftErrors } from "./StepFieldError.js";
```

Replace

```ts
    // False when the AI editor does not exist: an AI step is then read-only and never blocks Save.
    aiEditable: boolean;
}

const SETTINGS_FIELD = "config.settings";

function validateReviewStep(step: EditorStep): StepFieldError[] {
    const config = readReviewConfig(step.config);
    if (config.teams.length > 0) {
        return [];
    }
    return [{ field: "config.teams", message: "Choose at least one reviewing team." }];
}
```

with

```ts
    // False when the AI editor does not exist: an AI step is then read-only and never blocks Save.
    aiEditable: boolean;
    // What is resolved for the references of the rules (R298).
    references: RuleReferences;
    // False while the `review` step type is unavailable (teams off): a People step is read-only and never blocks Save (R304).
    reviewAvailable: boolean;
}

const SETTINGS_FIELD = "config.settings";
const RULE_TARGET_FIELD = "config.assignment.rules.target";

function validateReviewStep(
    step: EditorStep,
    params: ValidateWorkflowDraftParams
): StepFieldError[] {
    if (!params.reviewAvailable) {
        return [];
    }

    const config = readReviewConfig(step.config);
    const errors: StepFieldError[] = [];
    if (config.teams.length === 0) {
        errors.push({ field: "config.teams", message: "Choose at least one reviewing team." });
    }

    const assignment = readAssignment(config.assignment);
    const issues = getRuleIssues(assignment.rules, {
        stepTeamIds: config.teams,
        references: params.references
    });
    for (const issue of issues) {
        if (issue.kind === "error") {
            errors.push({ field: RULE_TARGET_FIELD, message: issue.message, ruleId: issue.ruleId });
        }
    }

    return errors;
}
```

Replace

```ts
    if (step.type === StepTypeId.Review) {
        return validateReviewStep(step);
    }
```

with

```ts
    if (step.type === StepTypeId.Review) {
        return validateReviewStep(step, params);
    }
```

In the doc comment above `validateWorkflowDraft` replace

```ts
 * field vocabulary (R267), so the presenter marks client and server errors the same way. Stale
 * configuration (a team without members, a missing automation, a retired model) is a warning, not
 * a blocker, and is not checked here.
 */
```

with

```ts
 * field vocabulary (R267), so the presenter marks client and server errors the same way. Stale
 * configuration (a team without members, a missing automation, a retired model, a deleted folder)
 * is a warning, not a blocker, and is not checked here; a rule target that is no longer valid is an
 * error (R299).
 */
```

Modify `packages/app-workflows/src/editor/model/getStepSummary.ts`. Replace the import block's last two lines

```ts
import { readReviewConfig } from "./readReviewConfig.js";
import type { StepContext } from "./StepContext.js";

const UNKNOWN_ITEM = "Unknown item";

function getReviewSummary(step: EditorStep, context: StepContext): string {
    const config = readReviewConfig(step.config);
    const names = config.teams.map(id => {
        const team = context.teams.find(item => item.id === id);
        return team ? team.name : UNKNOWN_ITEM;
    });
    return names.join(" + ");
}
```

with

```ts
import type { AssignmentStrategy } from "./assignment/AssignmentStrategy.js";
import { readAssignment } from "./assignment/readAssignment.js";
import { readReviewConfig } from "./readReviewConfig.js";
import type { StepContext } from "./StepContext.js";

const UNKNOWN_ITEM = "Unknown item";

const STRATEGY_NAMES: Record<AssignmentStrategy, string> = {
    none: "Team pool",
    roundRobin: "Round-robin",
    leastLoaded: "Least-loaded"
};

function getReviewSummary(step: EditorStep, context: StepContext): string {
    // Team names do not resolve while teams are off, so a step of an unavailable review row has none.
    if (!context.reviewAvailable) {
        return "";
    }
    const config = readReviewConfig(step.config);
    if (config.teams.length === 0) {
        return "";
    }

    const names = config.teams.map(id => {
        const team = context.teams.find(item => item.id === id);
        return team ? team.name : UNKNOWN_ITEM;
    });
    const parts = [names.join(" + ")];

    const assignment = readAssignment(config.assignment);
    if (assignment.strategy !== null) {
        parts.push(STRATEGY_NAMES[assignment.strategy]);
    }
    const count = assignment.rules.length;
    if (count > 0) {
        const noun = count === 1 ? "rule" : "rules";
        parts.push(`${count} routing ${noun}`);
    }
    if (assignment.allowManualPick) {
        parts.push("requester can pick");
    }

    return parts.join(" · ");
}
```

Replace the doc comment of `getStepSummary`

```ts
 * The summary line of a step card (R272-R275): People `{Teams joined with +}` (9a has no strategy
 * part), Automation `{Automation}`, AI `{Model} · n tool(s)[ · can change content]`. Empty for a
 * type the editor has no form for. Pure.
```

with

```ts
 * The summary line of a step card (R272-R275, R308): People `{Teams joined with +} · {Team
 * pool|Round-robin|Least-loaded}[ · n routing rule(s)][ · requester can pick]`, Automation
 * `{Automation}`, AI `{Model} · n tool(s)[ · can change content]`. Empty for a type the editor has
 * no form for and for a People step while teams are off. Pure.
```

Create `packages/app-workflows/src/editor/model/StepWarningLine.ts`:

```ts
/*
 * One line of a step's warnings. `error` is a live rule error (destructive on the card, Save is
 * blocked by `validateWorkflowDraft`), `warning` never blocks. `ruleId` is set on the rule lines
 * only, so a server error for the same rule can replace the live line (no double line).
 */
export interface StepWarningLine {
    text: string;
    severity: "error" | "warning";
    ruleId?: string;
}
```

Modify `packages/app-workflows/src/editor/model/getStepWarnings.ts`. Replace the import lines

```ts
import { readAutomationConfig } from "./readAutomationConfig.js";
import { readReviewConfig } from "./readReviewConfig.js";
import type { StepContext } from "./StepContext.js";
```

with

```ts
import { readAssignment } from "./assignment/readAssignment.js";
import { readAutomationConfig } from "./readAutomationConfig.js";
import { readReviewConfig } from "./readReviewConfig.js";
import { getRuleIssues } from "./rules/getRuleIssues.js";
import type { StepContext } from "./StepContext.js";
import type { StepWarningLine } from "./StepWarningLine.js";
import { TEAMS_OFF_STEP_MESSAGE } from "./teamsOffMessage.js";
```

Replace `getReviewWarnings`

```ts
function getReviewWarnings(step: EditorStep, context: StepContext): string[] {
    const config = readReviewConfig(step.config);
    const warnings: string[] = [];
    for (const id of config.teams) {
        const team = context.teams.find(item => item.id === id);
        if (team && team.memberCount === 0) {
            warnings.push(`${team.name} has no members.`);
        }
    }
    return warnings;
}
```

with

```ts
function toWarningLines(texts: string[]): StepWarningLine[] {
    return texts.map((text): StepWarningLine => {
        return { text, severity: "warning" };
    });
}

function getReviewWarnings(step: EditorStep, context: StepContext): StepWarningLine[] {
    if (!context.reviewAvailable) {
        return [{ text: TEAMS_OFF_STEP_MESSAGE, severity: "warning" }];
    }

    const config = readReviewConfig(step.config);
    const lines: StepWarningLine[] = [];
    for (const id of config.teams) {
        const team = context.teams.find(item => item.id === id);
        if (team && team.memberCount === 0) {
            lines.push({ text: `${team.name} has no members.`, severity: "warning" });
        }
    }

    // Rule warnings and the live rule errors, prefixed with the rule's position (R299, R312).
    const assignment = readAssignment(config.assignment);
    const issues = getRuleIssues(assignment.rules, {
        stepTeamIds: config.teams,
        references: context.references
    });
    for (const issue of issues) {
        const text = `Rule ${issue.index + 1}: ${issue.message}`;
        lines.push({ text, severity: issue.kind, ruleId: issue.ruleId });
    }

    return lines;
}
```

Replace the three branches and the doc comment of `getStepWarnings`

```ts
/*
 * The amber warning lines of a step card (R272-R275, QBZ-8, QBZ-13, QBZ-47). Warnings never block
 * a save. Pure.
 */
export const getStepWarnings = (step: EditorStep, context: StepContext): string[] => {
    if (step.type === StepTypeId.Review) {
        return getReviewWarnings(step, context);
    }
    if (step.type === StepTypeId.Automation) {
        return getAutomationStepWarnings(step, context);
    }
    if (step.type === StepTypeId.Ai) {
        return getAiWarnings(step, context);
    }
    return [];
};
```

with

```ts
/*
 * The lines of a step card (R272-R275, QBZ-8, QBZ-13, QBZ-47, R299, R309). A line never blocks a
 * save by itself: a People step's live rule errors appear here with severity `error`, and Save is
 * blocked by `validateWorkflowDraft`. Pure.
 */
export const getStepWarnings = (step: EditorStep, context: StepContext): StepWarningLine[] => {
    if (step.type === StepTypeId.Review) {
        return getReviewWarnings(step, context);
    }
    if (step.type === StepTypeId.Automation) {
        const texts = getAutomationStepWarnings(step, context);
        return toWarningLines(texts);
    }
    if (step.type === StepTypeId.Ai) {
        const texts = getAiWarnings(step, context);
        return toWarningLines(texts);
    }
    return [];
};
```

Modify `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts`. Add the imports after `import { isAiEditable } from "~/editor/model/isAiEditable.js";`:

```ts
import { isReviewAvailable } from "~/editor/model/isReviewAvailable.js";
import { createEmptyRuleReferences } from "~/editor/model/rules/createEmptyRuleReferences.js";
```

In the save method replace

```ts
            automations: this.automations.items,
            aiEditable: isAiEditable(this.stepTypes.items)
        });
        const invalid =
```

with

```ts
            automations: this.automations.items,
            aiEditable: isAiEditable(this.stepTypes.items),
            references: createEmptyRuleReferences(),
            reviewAvailable: isReviewAvailable(this.stepTypes.items)
        });
        const invalid =
```

and in `getStepContext` replace

```ts
            aiEditable,
            baselineStep: this.draft.getBaselineStep(step.id)
        };
```

with

```ts
            aiEditable,
            baselineStep: this.draft.getBaselineStep(step.id),
            references: createEmptyRuleReferences(),
            reviewAvailable: isReviewAvailable(this.stepTypes.items)
        };
```

(Task 14 replaces both `createEmptyRuleReferences()` calls with the presenter's resolved references.)

`getStepWarnings` now returns lines, and the card view model still takes `warnings: string[]` until Task 24, so in `buildFlow` replace

```ts
            const context = this.getStepContext(step, aiEditable);
            const entry = this.stepErrors.find(item => item.stepId === step.id);

            return buildStepCardVm({
                step,
                index,
                count,
                typeLabel: getStepTypeLabel(step.type, stepTypes),
                summary: getStepSummary(step, context),
                warnings: getStepWarnings(step, context),
```

with

```ts
            const context = this.getStepContext(step, aiEditable);
            const entry = this.stepErrors.find(item => item.stepId === step.id);
            const warningLines = getStepWarnings(step, context);
            const warnings = warningLines.map(line => line.text);

            return buildStepCardVm({
                step,
                index,
                count,
                typeLabel: getStepTypeLabel(step.type, stepTypes),
                summary: getStepSummary(step, context),
                warnings,
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/model/isReviewAvailable.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/validateWorkflowDraft.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/model/getStepSummary.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/model/getStepWarnings.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.flow.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.teamSearch.test.ts 2>&1 | tail -30
```

Expected: PASS. If the `keeps the shared checks and the other step types working` case reports a different automation field, print `errors.stepErrors[1]` and use the field the 9a automation case in the same file already asserts for a missing `url` (`config.settings.url`).

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/editor/model 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/feature.test.ts packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors. If another presenter or component test still asserts a People step summary without the strategy part (`Editors`, `Legal`), update it the same way (`Editors · Team pool`); the fixtures' default step has `strategy: "none"`, no rules and no pick. `grep -rn "summary" packages/app-workflows/src --include=*.test.ts --include=*.test.tsx` lists the candidates; tests that pass a literal summary into a view model are unaffected.

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-workflows): validate rule targets and summarise the assignment" -m "validateWorkflowDraft blocks Save on rule errors (no target, a user or team target outside the reviewing teams, a deleted user or team) with the rule id and never for warnings or for a People step while teams are off. The People card summary names the strategy, the rule count and requester can pick, and the step warnings carry the Rule n lines and the teams-off line." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`StepFieldError.ruleId` is optional here** (`ruleId?: string | null`). The contract gives the field to Task 15 as `string | null`, but Task 12's validation must already carry it; making it required now would force every server-error constructor (`mapSaveError`, Task 15) into this task. Task 15 makes it required and sets `null` for non-rule errors.
- **`isReviewAvailable` and `TEAMS_OFF_STEP_MESSAGE` are extra files** (`model/isReviewAvailable.ts`, `model/teamsOffMessage.ts`). The contract has the rule "read-only exactly when the `review` row of `listStepTypes` is not available" in Task 16 and the message text in R290 and R309; both are needed here, so they live in the model for Tasks 16 and 24 to import. A missing `review` row counts as available.
- **The presenter passes `createEmptyRuleReferences()`** in two places until Task 14 supplies the resolved references; no rule reference issue can arise from empty references, only the no-target error. The rule errors on Save therefore work from this commit for the no-target case.
- **The People summary of 9a changes** (R308 adds the strategy part), so the 9a presenter expectations in `WorkflowEditorPresenter.flow.test.ts` and `WorkflowEditorPresenter.teamSearch.test.ts` change in this task.
- **`getStepWarnings` returns `StepWarningLine[]`** (controller ruling, consistency items): `{ text, severity: "error" | "warning" }` plus an optional `ruleId` on rule lines. The contract's `string[]` becomes a line type so the card can show live rule errors destructive (R299). `ruleId` is an addition to the ruled shape: Task 24 and Task 16 need it to drop the live line of a rule that has a server error. The presenter here maps the lines to `text` for the card view model (`warnings: string[]`) until Task 24 passes the severity on.
- **Rules without a stored id** get a random id from `readAssignment` on every call (R314), so for such odd data the `ruleId` of a client error or a line is not stable between calls; a normal saved rule always has its stored id.

## Review fixes (sub-phase review)

- `getStepWarnings` now returns `{ text, severity }` lines (new `StepWarningLine.ts`, controller ruling): implementation, the whole `getStepWarnings.test.ts` (all existing assertions converted, new severity and `ruleId` cases), the `WorkflowEditorPresenter.buildFlow` hunk that maps lines to text so the card view model compiles, and the Produces entry.
- Removed `yarn check:test:types -p app-workflows` from Step 5 (8a R243: the package has no `__tests__` folder; the build type-checks the co-located tests).
- Named the plural noun of the routing-rule count in `getStepSummary` instead of a ternary inside a template literal.
