### Task 15: Rule server errors and the tab of an error

R288, R299, R302, R303, R304; D171; Q51; Review Focus 3; QBZ-11, QBZ-12. The save path learns the rule id of a validation error and gives every error one stable shape the drawer can map (Task 16):

- the API's validation error data carries `ruleId` (Task 3); `mapSaveError` reads it (`ValidationFailure.ruleId`, `null` when absent) and `StepFieldError` carries it (`ruleId: string | null`);
- `getRuleErrorsFromSave(failure, step)` turns a failure into the step's `StepFieldError[]`: a rule-level failure with a `ruleId` keeps it; a schema failure `config.assignment.rules.<index>.<path>` is converted at mapping time to the id of the rule at that index of the step as it was sent, and its field is normalised to `config.assignment.rules.<path>` (the index is dropped), so a later reorder keeps the error on the same rule (R303); an index with no rule keeps `ruleId` null and falls back to the top of the drawer;
- `getFormFieldPath` maps `config.assignment.strategy` and `config.assignment.allowManualPick` to their form fields and every `config.assignment.rules…` field to the `assignment.rules` field (the form field carrying the tab's error mark, R293, R302); `getRuleErrorField` names the rule field a normalised field belongs to (`target`, `requesterUser`, `requesterTeam`, `folder`, or null for the card itself);
- `getStepErrorTab(errors)` says which tab holds the first error that has a form field: rule and assignment fields `assignment`, the other fields with a form field `general`, none for an error shown at the top of the drawer (R302);
- the step card strip reads `Rule {n}: {message}` for an error with a `ruleId`, where `n` is the rule's current position (R303), so a card edited then reordered keeps the right number.

The editor presenter's `openStep` needs no change: the drawer reads the tab from `getStepFieldErrors` through `getStepErrorTab` when it opens (Task 16). Client-validation errors of Task 12 use the same fields and the same `ruleId`, so they take the same path. The gateway keeps the error `data` as the server sent it, so `ruleId` reaches the presenter: this task asserts it for the shared use cases, the CMS and the Website Builder gateway.

**Files:**
- Create: `packages/app-workflows/src/editor/model/getStepErrorTab.ts`
- Create: `packages/app-workflows/src/editor/model/getStepRuleIds.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/getRuleErrorsFromSave.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepDrawer/getRuleErrorField.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/ruleErrorsPure.test.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ruleErrors.test.ts`
- Modify: `packages/app-workflows/src/editor/model/StepFieldError.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/mapSaveError.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/mapSaveError.test.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/buildStepCardVm.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/buildStepCardVm.test.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts`
- Modify: `packages/app-workflows/src/editor/presentation/stepDrawer/getFormFieldPath.ts`
- Modify: `packages/app-workflows/src/editor/presentation/stepDrawer/stepDrawerPure.test.ts`
- Modify: `packages/app-workflows/src/editor/useCases/toOperationError.test.ts`
- Modify: `packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.test.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGatewayImpl.test.ts`
- Modify: `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGatewayImpl.test.ts`
- Modify (a `StepFieldError` literal without `ruleId`, found by the type check): every file that builds one, listed in Step 3.

**Interfaces:**
- Consumes: Task 3 (the server sends `data.ruleId` and the field `config.assignment.rules.target` for a rule-level failure, `config.assignment.rules.<index>.<path>` for a schema failure), Task 9 (`readAssignment`), Task 11 (`RuleIssue["field"]`), Task 12 (`validateWorkflowDraft` errors carry `ruleId` and the field `config.assignment.rules.target`; `StepFieldError.ruleId?` optional), Task 14 (`createRoutingStep`, `createStoredRule`), 9a (`mapSaveError`, `ValidationFailure`, `applyServerStepError`, `buildStepCardVm`, `getFormFieldPath`, `StepFieldError`, `GraphQLOperationError`, `WorkflowErrorCode`).
- Produces: `StepFieldError.ruleId: string | null`, `ValidationFailure.ruleId: string | null`, `getRuleErrorsFromSave(failure: ValidationFailure, step: EditorStep | null): StepFieldError[]`, `getStepErrorTab(errors: StepFieldError[]): "general" | "assignment" | null`, `getStepRuleIds(step: EditorStep): string[]`, `getRuleErrorField(field: string): RuleIssue["field"] | null`, `getFormFieldPath` for the assignment fields, `StepCardParams.ruleIds`, the card strip `Rule {n}: {message}`.

**Test runner note:** admin packages, `yarn test <path>` only. Type check: `yarn build -p @webiny/<package> --no-cache 2>&1 | tail -30` for `app-workflows`, `app-headless-cms-workflows` and `app-website-builder-workflows` (8a R243).

- [ ] **Step 0: Preconditions**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
cat packages/app-workflows/src/editor/model/StepFieldError.ts
grep -n "ruleId" packages/app-workflows/src/editor/model/validateWorkflowDraft.ts
grep -n "ruleId" packages/api-workflows/src/domain/workflow/errors.ts
```

Expected: Task 3 added `ruleId` to the API error data, and Task 12 left `StepFieldError` with the optional `ruleId?: string | null`. Step 3 makes it required (`ruleId: string | null`) and adds `ruleId: null` to every literal that has none.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/presentation/editor/ruleErrorsPure.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createRoutingStep } from "~/editor/testing/routingStepFixtures.js";
import { createStoredRule } from "~/editor/testing/routingStepFixtures.js";
import { getStepErrorTab } from "~/editor/model/getStepErrorTab.js";
import { getStepRuleIds } from "~/editor/model/getStepRuleIds.js";
import { getRuleErrorField } from "~/editor/presentation/stepDrawer/getRuleErrorField.js";
import { getRuleErrorsFromSave } from "./getRuleErrorsFromSave.js";
import type { ValidationFailure } from "./mapSaveError.js";

const step = () => {
    return createRoutingStep([
        createStoredRule({ id: "r-a" }),
        createStoredRule({ id: "r-b" }),
        createStoredRule({ id: "r-c" })
    ]);
};

const failure = (overrides: Partial<ValidationFailure>): ValidationFailure => {
    return {
        kind: "validation",
        message: "Something is wrong.",
        stepId: "step-1",
        field: null,
        workflowId: null,
        ruleId: null,
        ...overrides
    };
};

describe("getRuleErrorsFromSave (R303)", () => {
    it("keeps the rule id and the field of a rule-level failure", () => {
        const errors = getRuleErrorsFromSave(
            failure({
                field: "config.assignment.rules.target",
                ruleId: "r-b",
                message: "The target user is not a member of the step's teams."
            }),
            step()
        );

        expect(errors).toEqual([
            {
                field: "config.assignment.rules.target",
                message: "The target user is not a member of the step's teams.",
                ruleId: "r-b"
            }
        ]);
    });

    it("converts the index of a schema failure to the id of the rule at that index and drops it from the field", () => {
        const errors = getRuleErrorsFromSave(
            failure({ field: "config.assignment.rules.2.target.id", message: "Required." }),
            step()
        );

        expect(errors).toEqual([
            { field: "config.assignment.rules.target.id", message: "Required.", ruleId: "r-c" }
        ]);
    });

    it("keeps the error on its rule when the rules are reordered later", () => {
        const [error] = getRuleErrorsFromSave(
            failure({ field: "config.assignment.rules.0.conditions.requesterUserId" }),
            step()
        );
        const reordered = ["r-c", "r-b", "r-a"];

        expect(error.ruleId).toBe("r-a");
        expect(reordered.indexOf(error.ruleId ?? "") + 1).toBe(3);
    });

    it("maps a schema failure of the rule itself", () => {
        const errors = getRuleErrorsFromSave(
            failure({ field: "config.assignment.rules.1", message: "Invalid rule." }),
            step()
        );

        expect(errors).toEqual([
            { field: "config.assignment.rules", message: "Invalid rule.", ruleId: "r-b" }
        ]);
    });

    it("leaves the rule id empty for an index no rule has, and for no step", () => {
        const outOfRange = getRuleErrorsFromSave(
            failure({ field: "config.assignment.rules.9.target.id" }),
            step()
        );
        const noStep = getRuleErrorsFromSave(
            failure({ field: "config.assignment.rules.0.target.id" }),
            null
        );

        expect(outOfRange[0].ruleId).toBeNull();
        expect(outOfRange[0].field).toBe("config.assignment.rules.target.id");
        expect(noStep[0].ruleId).toBeNull();
    });

    it("passes every other field through with a null rule id", () => {
        const title = getRuleErrorsFromSave(failure({ field: "title" }), step());
        const none = getRuleErrorsFromSave(failure({ field: null }), step());
        const strategy = getRuleErrorsFromSave(
            failure({ field: "config.assignment.strategy" }),
            step()
        );

        expect(title).toEqual([{ field: "title", message: "Something is wrong.", ruleId: null }]);
        expect(none).toEqual([{ field: "", message: "Something is wrong.", ruleId: null }]);
        expect(strategy[0].ruleId).toBeNull();
    });
});

describe("getStepErrorTab (R302)", () => {
    const error = (field: string) => {
        return { field, message: "Wrong.", ruleId: null };
    };

    it("sends rule and assignment fields to the Assignment tab", () => {
        expect(getStepErrorTab([error("config.assignment.rules.target")])).toBe("assignment");
        expect(getStepErrorTab([error("config.assignment.strategy")])).toBe("assignment");
        expect(getStepErrorTab([error("config.assignment.allowManualPick")])).toBe("assignment");
    });

    it("sends the other fields that have a form field to the General tab", () => {
        for (const field of [
            "title",
            "color",
            "notifications",
            "config.teams",
            "config.teams.0",
            "config.automationId",
            "config.settings.url",
            "config.instructions",
            "config.model",
            "config.tools"
        ]) {
            expect(getStepErrorTab([error(field)])).toBe("general");
        }
    });

    it("names no tab for an error shown at the top and for no error", () => {
        expect(getStepErrorTab([error("")])).toBeNull();
        expect(getStepErrorTab([error("id")])).toBeNull();
        expect(getStepErrorTab([error("config.settings")])).toBeNull();
        expect(getStepErrorTab([error("config.assignment")])).toBeNull();
        expect(getStepErrorTab([error("config.assignment.somethingElse")])).toBeNull();
        expect(getStepErrorTab([])).toBeNull();
    });

    it("takes the tab of the first error that has one", () => {
        expect(getStepErrorTab([error(""), error("config.assignment.rules.target")])).toBe(
            "assignment"
        );
        expect(getStepErrorTab([error("title"), error("config.assignment.rules.target")])).toBe(
            "general"
        );
    });
});

describe("getRuleErrorField (R303)", () => {
    it("names the rule field of a normalised path", () => {
        expect(getRuleErrorField("config.assignment.rules.target")).toBe("target");
        expect(getRuleErrorField("config.assignment.rules.target.id")).toBe("target");
        expect(getRuleErrorField("config.assignment.rules.target.type")).toBe("target");
        expect(getRuleErrorField("config.assignment.rules.conditions.requesterUserId")).toBe(
            "requesterUser"
        );
        expect(getRuleErrorField("config.assignment.rules.conditions.requesterTeamId")).toBe(
            "requesterTeam"
        );
        expect(getRuleErrorField("config.assignment.rules.conditions.folder")).toBe("folder");
        expect(getRuleErrorField("config.assignment.rules.conditions.folder.id")).toBe("folder");
        expect(
            getRuleErrorField("config.assignment.rules.conditions.folder.includeDescendants")
        ).toBe("folder");
    });

    it("is null for the card itself and for paths it does not know", () => {
        expect(getRuleErrorField("config.assignment.rules")).toBeNull();
        expect(getRuleErrorField("config.assignment.rules.id")).toBeNull();
        expect(getRuleErrorField("config.assignment.rules.conditions.modelId")).toBeNull();
        expect(getRuleErrorField("title")).toBeNull();
    });
});

describe("getStepRuleIds", () => {
    it("lists the stored rule ids in order, one entry per rule", () => {
        expect(getStepRuleIds(step())).toEqual(["r-a", "r-b", "r-c"]);
    });

    it("keeps the positions of rules without an id and is empty for other steps", () => {
        const odd = createRoutingStep([createStoredRule({ id: "r-a" }), { target: null }]);

        expect(getStepRuleIds(odd)).toEqual(["r-a", ""]);
        expect(getStepRuleIds(createAiStep())).toEqual([]);
    });
});
```

In `packages/app-workflows/src/editor/presentation/stepDrawer/stepDrawerPure.test.ts`, inside `describe("getFormFieldPath (R267, R276)", …)`, replace the last `it` (`it("is null for a field with no form field in 9a", () => { … });`, the one that expects `getFormFieldPath("config.assignment.rules")` to be null) with these two:

```ts
    it("is null for a field with no form field", () => {
        expect(getFormFieldPath(null)).toBeNull();
        expect(getFormFieldPath("")).toBeNull();
        expect(getFormFieldPath("id")).toBeNull();
        expect(getFormFieldPath("type")).toBeNull();
        expect(getFormFieldPath("config.settings")).toBeNull();
        expect(getFormFieldPath("config.assignment")).toBeNull();
        expect(getFormFieldPath("config.somethingElse")).toBeNull();
    });

    it("maps the assignment fields (R303)", () => {
        expect(getFormFieldPath("config.assignment.strategy")).toBe("assignment.strategy");
        expect(getFormFieldPath("config.assignment.allowManualPick")).toBe(
            "assignment.allowManualPick"
        );
        expect(getFormFieldPath("config.assignment.rules")).toBe("assignment.rules");
        expect(getFormFieldPath("config.assignment.rules.target")).toBe("assignment.rules");
        expect(getFormFieldPath("config.assignment.rules.target.id")).toBe("assignment.rules");
        expect(getFormFieldPath("config.assignment.rules.conditions.folder.id")).toBe(
            "assignment.rules"
        );
    });
```



Add to `packages/app-workflows/src/editor/presentation/editor/mapSaveError.test.ts` (read its helpers first and follow them; the case asserts through the file's own `GraphQLOperationError` helper):

```ts
    it("reads the rule id of a validation error, null when the server sends none (R288)", () => {
        const withRule = mapSaveError(
            new GraphQLOperationError({
                code: WorkflowErrorCode.Validation,
                message: "The target team is not one of the step's reviewing teams.",
                data: {
                    stepId: "step-1",
                    field: "config.assignment.rules.target",
                    workflowId: null,
                    ruleId: "r-1"
                }
            })
        );
        const withoutRule = mapSaveError(
            new GraphQLOperationError({
                code: WorkflowErrorCode.Validation,
                message: "Step needs a title.",
                data: { stepId: "step-1", field: "title", workflowId: null }
            })
        );

        expect(withRule).toMatchObject({ kind: "validation", ruleId: "r-1" });
        expect(withoutRule).toMatchObject({ kind: "validation", ruleId: null });
    });
```

(Place it inside the existing top-level `describe`; the file already imports `GraphQLOperationError` and `WorkflowErrorCode`.) In the existing case `reads the validation data`, add `ruleId: null` to the `toEqual` object, after `workflowId: null`:

```ts
            field: "config.teams",
            workflowId: null,
            ruleId: null
        });
```

Replace the existing `shows the first error of the step as the strip` test (its error literals gain `ruleId: null`), add the three cases after it, and extend the params helper (add `ruleIds: [],` after `errors: [],`) in `packages/app-workflows/src/editor/presentation/editor/buildStepCardVm.test.ts`:

```ts
const params = (overrides: Partial<StepCardParams> = {}): StepCardParams => {
    return {
        step: createReviewStep(),
        index: 0,
        count: 1,
        typeLabel: "People",
        summary: "Editors",
        warnings: [],
        errors: [],
        ruleIds: [],
        readOnly: false,
        ...overrides
    };
};
```

```ts
    it("shows the first error of the step as the strip", () => {
        const card = buildStepCardVm(
            params({
                errors: [
                    { field: "title", message: "Enter a title for this step.", ruleId: null },
                    {
                        field: "color",
                        message: "Enter a hex colour, e.g. #3B6FD4.",
                        ruleId: null
                    }
                ]
            })
        );

        expect(card.error).toBe("Enter a title for this step.");
    });

    it("prefixes the strip of a rule error with the rule's current position (R303)", () => {
        const errors = [
            {
                field: "config.assignment.rules.target",
                message: "Choose who this rule assigns to.",
                ruleId: "r-b"
            }
        ];

        const before = buildStepCardVm(params({ errors, ruleIds: ["r-a", "r-b", "r-c"] }));
        const reordered = buildStepCardVm(params({ errors, ruleIds: ["r-b", "r-c", "r-a"] }));

        expect(before.error).toBe("Rule 2: Choose who this rule assigns to.");
        expect(reordered.error).toBe("Rule 1: Choose who this rule assigns to.");
    });

    it("shows the plain message when the rule is gone or the error names no rule", () => {
        const gone = buildStepCardVm(
            params({
                errors: [{ field: "config.assignment.rules.target", message: "Gone.", ruleId: "r-x" }],
                ruleIds: ["r-a"]
            })
        );
        const none = buildStepCardVm(
            params({
                errors: [{ field: "config.assignment.rules", message: "Odd.", ruleId: null }],
                ruleIds: ["r-a"]
            })
        );

        expect(gone.error).toBe("Gone.");
        expect(none.error).toBe("Odd.");
    });
```

Create `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ruleErrors.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createListedUser } from "~/editor/testing/routingStepFixtures.js";
import { createRoutingStep } from "~/editor/testing/routingStepFixtures.js";
import { createStoredRule } from "~/editor/testing/routingStepFixtures.js";

const failure = (data: unknown, message: string): GraphQLOperationError => {
    return new GraphQLOperationError({ code: WorkflowErrorCode.Validation, data, message });
};

const dirtySetup = async () => {
    const setup = createEditorPresenterSetup();
    setup.useCases.getWorkflow.mockResolvedValue(
        createEditorWorkflow({
            steps: [
                createRoutingStep([
                    createStoredRule({ id: "r-1", target: { type: "user", id: "user-1" } }),
                    createStoredRule({ id: "r-2", target: { type: "user", id: "user-2" } })
                ])
            ]
        })
    );
    setup.app.listFolders.mockResolvedValue([]);
    setup.useCases.folderExists.mockResolvedValue(true);
    // Both targets resolve and belong to the step's team, so client validation lets the save through.
    setup.config.listUsers.mockResolvedValue({
        users: [createListedUser("user-1", "Ada Lovelace"), createListedUser("user-2", "Grace Hopper")],
        missingIds: []
    });
    await setup.presenter.init(setup.params);
    setup.presenter.setName("Changed");
    return setup;
};

describe("WorkflowEditorPresenter: rule errors of a save (R303, Review Focus 3)", () => {
    it("marks the rule the server names by its id and shows the strip with its position", async () => {
        const { presenter, useCases, toasts } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(
            failure(
                {
                    stepId: "step-1",
                    field: "config.assignment.rules.target",
                    workflowId: null,
                    ruleId: "r-2"
                },
                "The target user is not a member of the step's teams."
            )
        );

        await presenter.save();

        expect(presenter.getStepFieldErrors("step-1")).toEqual([
            {
                field: "config.assignment.rules.target",
                message: "The target user is not a member of the step's teams.",
                ruleId: "r-2"
            }
        ]);
        expect(presenter.vm.flow.steps[0].error).toBe(
            "Rule 2: The target user is not a member of the step's teams."
        );
        expect(presenter.vm.scrollRequest).toEqual({ stepId: "step-1", nonce: 1 });
        expect(toasts.error).toHaveBeenCalledWith("Could not save. Check the highlighted step.");
    });

    it("converts the index of a schema failure to the rule's id when it maps the error", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(
            failure(
                {
                    stepId: "step-1",
                    field: "config.assignment.rules.1.target.id",
                    workflowId: null
                },
                "Required."
            )
        );

        await presenter.save();

        expect(presenter.getStepFieldErrors("step-1")).toEqual([
            { field: "config.assignment.rules.target.id", message: "Required.", ruleId: "r-2" }
        ]);
        expect(presenter.vm.flow.steps[0].error).toBe("Rule 2: Required.");
    });

    it("keeps an error that names no rule as it is, with a null rule id", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(
            failure(
                {
                    stepId: "step-1",
                    field: "config.assignment.rules.9.target.id",
                    workflowId: null
                },
                "Required."
            )
        );

        await presenter.save();

        expect(presenter.getStepFieldErrors("step-1")).toEqual([
            { field: "config.assignment.rules.target.id", message: "Required.", ruleId: null }
        ]);
        expect(presenter.vm.flow.steps[0].error).toBe("Required.");
    });

    it("gives a field error that is not a rule error a null rule id", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(
            failure(
                { stepId: "step-1", field: "config.teams", workflowId: null },
                "Step needs a team."
            )
        );

        await presenter.save();

        expect(presenter.getStepFieldErrors("step-1")).toEqual([
            { field: "config.teams", message: "Step needs a team.", ruleId: null }
        ]);
    });

    it("keeps the error for the drawer when the step is opened, and clears it when the step is edited", async () => {
        const { presenter, useCases } = await dirtySetup();
        useCases.storeWorkflow.mockRejectedValue(
            failure(
                {
                    stepId: "step-1",
                    field: "config.assignment.rules.target",
                    workflowId: null,
                    ruleId: "r-1"
                },
                "The target team is not one of the step's reviewing teams."
            )
        );
        await presenter.save();

        presenter.openStep("step-1");
        expect(presenter.vm.openStepId).toBe("step-1");
        expect(presenter.getStepFieldErrors("step-1")[0].ruleId).toBe("r-1");

        presenter.updateStep("step-1", { title: "Renamed" });

        expect(presenter.getStepFieldErrors("step-1")).toEqual([]);
        expect(presenter.vm.flow.steps[0].error).toBeNull();
    });

    it("gives a client validation error the same field and rule id (R304)", async () => {
        const setup = createEditorPresenterSetup();
        setup.useCases.getWorkflow.mockResolvedValue(
            createEditorWorkflow({
                steps: [
                    createRoutingStep([
                        createStoredRule({ id: "r-1", target: { type: "user", id: "user-1" } }),
                        createStoredRule({ id: "r-2", target: null })
                    ])
                ]
            })
        );
        setup.app.listFolders.mockResolvedValue([]);
        setup.useCases.folderExists.mockResolvedValue(true);
        setup.config.listUsers.mockResolvedValue({
            users: [createListedUser("user-1", "Ada Lovelace")],
            missingIds: []
        });
        await setup.presenter.init(setup.params);
        setup.presenter.setName("Changed");

        await setup.presenter.save();

        expect(setup.presenter.getStepFieldErrors("step-1")).toContainEqual({
            field: "config.assignment.rules.target",
            message: "Choose who this rule assigns to.",
            ruleId: "r-2"
        });
        expect(setup.presenter.vm.flow.steps[0].error).toBe(
            "Rule 2: Choose who this rule assigns to."
        );
        expect(setup.useCases.storeWorkflow).not.toHaveBeenCalled();
        expect(setup.toasts.error).toHaveBeenCalledWith("Fix the highlighted steps before saving.");
    });
});
```

Add to `packages/app-workflows/src/editor/useCases/toOperationError.test.ts` (inside the `describe`):

```ts
    it("keeps the rule id of a validation error in the data (R288)", () => {
        const data = {
            stepId: "step-1",
            field: "config.assignment.rules.target",
            workflowId: null,
            ruleId: "r-1"
        };

        const error = toOperationError({
            code: "Workflows/Workflow/Validation",
            message: "The target user is not a member of the step's teams.",
            data
        });

        expect(error.data).toEqual(data);
    });
```

Add to `packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.test.ts`, inside `describe("storeWorkflow", …)`:

```ts
        it("throws the validation error with the rule id the server named (R288)", async () => {
            const data = {
                stepId: "step-1",
                field: "config.assignment.rules.target",
                workflowId: null,
                ruleId: "r-1"
            };
            gateway.storeWorkflow.mockResolvedValue({
                data: null,
                error: {
                    code: WorkflowErrorCode.Validation,
                    message: "The target team is not one of the step's reviewing teams.",
                    data
                }
            });

            const thrown = await useCases.storeWorkflow(storeParams).catch((error: unknown) => {
                return error;
            });

            expect(thrown).toBeInstanceOf(GraphQLOperationError);
            if (thrown instanceof GraphQLOperationError) {
                expect(thrown.data).toEqual(data);
            }
        });
```

Add to `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGatewayImpl.test.ts`, inside `describe("storeWorkflow", …)` after the conflict case:

```ts
        it("returns a validation envelope with the rule id as it is (R288)", async () => {
            const envelope = {
                data: null,
                error: {
                    code: "Workflows/Workflow/Validation",
                    message: "The target team is not one of the step's reviewing teams.",
                    data: {
                        stepId: "step-1",
                        field: "config.assignment.rules.target",
                        workflowId: null,
                        ruleId: "r-1"
                    }
                }
            };
            client.execute.mockResolvedValue({ cms: { storeCmsEntryWorkflow: envelope } });

            const result = await gateway.storeWorkflow({ data: input, savedOn: EDITOR_SAVED_ON });

            expect(result).toEqual(envelope);
            expect(result.error?.data).toMatchObject({ ruleId: "r-1" });
        });
```

and the same case in `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGatewayImpl.test.ts`, with `client.execute.mockResolvedValue({ websiteBuilder: { storeWebsiteBuilderPageWorkflow: envelope } });`.

- [ ] **Step 2: Run the tests and expect failure**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
yarn test packages/app-workflows/src/editor/presentation/editor/ruleErrorsPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/stepDrawerPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/mapSaveError.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/buildStepCardVm.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ruleErrors.test.ts 2>&1 | tail -30
```

Expected: the first fails with `Failed to resolve import "~/editor/model/getStepErrorTab.js"`; the second with `expected 'assignment.rules' to be null` style failures; the third with `ruleId` missing from the mapped failure; the fourth with the strip without the `Rule 2:` prefix; the fifth with `ruleId` missing from `getStepFieldErrors`. The gateway and use-case assertions already pass (the error `data` was always kept as sent): they pin the behaviour.

- [ ] **Step 3: Implement**

Modify `packages/app-workflows/src/editor/model/StepFieldError.ts` (the file as Task 12 left it). Replace

```ts
    // The rule a rule-level error belongs to (R288, R299); absent for every other error. Task 15 makes it required.
    ruleId?: string | null;
```

with

```ts
    // The rule a rule-level error belongs to (R288, R299, R303), else null. A rule error's `field` has no index.
    ruleId: string | null;
```

then add `ruleId: null` to every `StepFieldError` literal that has none. In the test files the literal is `{ field: "…", message: "…" }`; run, from the repository root,

```bash
sed -i '' -E 's/(\{ field: "[^"]*", message: "[^"]*")( \})/\1, ruleId: null\2/' \
  packages/app-workflows/src/editor/model/validateWorkflowDraft.ts \
  packages/app-workflows/src/editor/model/validateWorkflowDraft.test.ts \
  packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.test.ts \
  packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawer.test.tsx \
  packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.save.test.ts \
  packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.saveFailures.test.ts \
  packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.flow.test.ts
```

and fix the literals the one-line pattern misses (a literal split over several lines, or one that uses a message constant; the type check lists each one). A literal that already has `ruleId` is not matched. Test helpers that read `error.ruleId` as a string must handle `null`.

Create `packages/app-workflows/src/editor/model/getStepErrorTab.ts`:

```ts
import type { StepFieldError } from "./StepFieldError.js";

export type StepErrorTab = "general" | "assignment";

const GENERAL_FIELDS = new Set([
    "title",
    "color",
    "notifications",
    "config.teams",
    "config.automationId",
    "config.instructions",
    "config.model",
    "config.tools"
]);

const ASSIGNMENT_FIELDS = new Set(["config.assignment.strategy", "config.assignment.allowManualPick"]);
const RULES_FIELD = "config.assignment.rules";

function getTab(field: string): StepErrorTab | null {
    // The same fields `getFormFieldPath` maps to the assignment form fields (R303).
    if (ASSIGNMENT_FIELDS.has(field) || field === RULES_FIELD || field.startsWith(`${RULES_FIELD}.`)) {
        return "assignment";
    }
    if (GENERAL_FIELDS.has(field)) {
        return "general";
    }
    // A zod path under `config.teams` and a setting of the automation form.
    if (field.startsWith("config.teams.") || field.startsWith("config.settings.")) {
        return "general";
    }
    return null;
}

/*
 * The tab of the drawer that holds the first error that has a form field (R302): rule and
 * assignment fields on `Assignment`, every other field with a form field on `General`. An error with
 * no form field (shown at the top of the drawer) and the Test routing tab never carry one. Pure.
 */
export const getStepErrorTab = (errors: StepFieldError[]): StepErrorTab | null => {
    for (const error of errors) {
        const tab = getTab(error.field);
        if (tab !== null) {
            return tab;
        }
    }
    return null;
};
```

Create `packages/app-workflows/src/editor/model/getStepRuleIds.ts`:

```ts
import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { EditorStep } from "~/editor/domain/types.js";
import { isRecord } from "./isRecord.js";
import { readReviewConfig } from "./readReviewConfig.js";

/*
 * The stored ids of a People step's rules, in order, one entry per rule (an empty string for a rule
 * without an id, so positions stay aligned). It never creates ids: the step card only needs the
 * position of a rule an error names (R303). Pure.
 */
export const getStepRuleIds = (step: EditorStep): string[] => {
    if (step.type !== StepTypeId.Review) {
        return [];
    }
    const assignment = readReviewConfig(step.config).assignment;
    if (assignment === null || !Array.isArray(assignment.rules)) {
        return [];
    }
    const ids: string[] = [];
    for (const rule of assignment.rules) {
        const id = isRecord(rule) ? rule.id : undefined;
        ids.push(typeof id === "string" ? id : "");
    }
    return ids;
};
```

Create `packages/app-workflows/src/editor/presentation/editor/getRuleErrorsFromSave.ts`:

```ts
import type { EditorStep } from "~/editor/domain/types.js";
import { readAssignment } from "~/editor/model/assignment/readAssignment.js";
import { readReviewConfig } from "~/editor/model/readReviewConfig.js";
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
import type { ValidationFailure } from "./mapSaveError.js";

const RULES_FIELD = "config.assignment.rules";
const INDEXED_RULE_FIELD = /^config\.assignment\.rules\.(\d+)(?:\.(.+))?$/;

/*
 * The step errors of a validation failure that names a step (R303). A rule-level failure arrives with
 * its `ruleId`. A schema failure arrives as `config.assignment.rules.<index>.<path>`: the index is
 * converted here to the id of the rule at that index of the step as it was sent, and dropped from
 * the field, so a later reorder keeps the error on its rule; an index with no rule leaves `ruleId`
 * null and the error is shown at the top of the drawer. Pure.
 */
export const getRuleErrorsFromSave = (
    failure: ValidationFailure,
    step: EditorStep | null
): StepFieldError[] => {
    const field = failure.field ?? "";
    const match = INDEXED_RULE_FIELD.exec(field);
    if (match === null) {
        return [{ field, message: failure.message, ruleId: failure.ruleId }];
    }

    const index = Number(match[1]);
    const path = match[2];
    const normalised = path === undefined ? RULES_FIELD : `${RULES_FIELD}.${path}`;
    let ruleId = failure.ruleId;
    if (ruleId === null && step !== null) {
        const config = readReviewConfig(step.config);
        const rules = readAssignment(config.assignment).rules;
        const rule = rules[index];
        ruleId = rule === undefined ? null : rule.id;
    }
    return [{ field: normalised, message: failure.message, ruleId }];
};
```

Create `packages/app-workflows/src/editor/presentation/stepDrawer/getRuleErrorField.ts`:

```ts
import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";

const PREFIX = "config.assignment.rules.";

/*
 * The rule field a normalised server field (the index already dropped, R303) belongs to: `target`,
 * `requesterUser`, `requesterTeam` or `folder`; null for the card itself (`id`, the rule as a whole)
 * and for a path the editor has no control for (an unknown condition). Pure.
 */
export const getRuleErrorField = (field: string): RuleIssue["field"] | null => {
    if (!field.startsWith(PREFIX)) {
        return null;
    }
    const path = field.slice(PREFIX.length);
    if (path === "target" || path.startsWith("target.")) {
        return "target";
    }
    if (path === "conditions.requesterUserId") {
        return "requesterUser";
    }
    if (path === "conditions.requesterTeamId") {
        return "requesterTeam";
    }
    if (path === "conditions.folder" || path.startsWith("conditions.folder.")) {
        return "folder";
    }
    return null;
};
```

Replace `packages/app-workflows/src/editor/presentation/stepDrawer/getFormFieldPath.ts` with:

```ts
const SETTINGS_PREFIX = "config.settings.";
const TEAMS_PREFIX = "config.teams.";
const RULES_FIELD = "config.assignment.rules";

const CONFIG_FIELDS: Record<string, string> = {
    "config.teams": "teams",
    "config.automationId": "automationId",
    "config.instructions": "instructions",
    "config.model": "model",
    "config.tools": "tools",
    "config.assignment.strategy": "assignment.strategy",
    "config.assignment.allowManualPick": "assignment.allowManualPick"
};

const STEP_FIELDS = new Set(["title", "color", "notifications"]);

/*
 * The form field a step error's `field` (R267, R288) belongs to, or null when the forms have none
 * (`id`, `type`, `config.settings` itself, another zod path, `config.assignment` itself, an empty
 * field): the drawer then shows the message at the top. Every rule field maps to `assignment.rules`,
 * the field that carries the Assignment tab's error mark; the rule and its field come from
 * `getRuleErrorField` and the error's `ruleId` (R303).
 */
export const getFormFieldPath = (field: string | null): string | null => {
    if (field === null) {
        return null;
    }
    if (STEP_FIELDS.has(field)) {
        return field;
    }
    // A zod issue of a review config path, e.g. `config.teams.0` (R267).
    if (field.startsWith(TEAMS_PREFIX)) {
        return "teams";
    }
    if (field.startsWith(SETTINGS_PREFIX)) {
        return `settings.${field.slice(SETTINGS_PREFIX.length)}`;
    }
    if (field === RULES_FIELD || field.startsWith(`${RULES_FIELD}.`)) {
        return "assignment.rules";
    }
    return CONFIG_FIELDS[field] ?? null;
};
```

Modify `packages/app-workflows/src/editor/presentation/editor/mapSaveError.ts`: add `ruleId: string | null;` to `ValidationFailure` after `workflowId`, and in `mapValidation`:

```ts
        workflowId: readString(data, "workflowId"),
        ruleId: readString(data, "ruleId")
```

Modify `packages/app-workflows/src/editor/presentation/editor/buildStepCardVm.ts`: add `ruleIds: string[];` to `StepCardParams` (after `errors`, comment `// The step's rule ids in order, to number a rule error (R303).`), and replace the `firstError` computation:

```ts
export const buildStepCardVm = (params: StepCardParams): StepCardVm => {
    const step = params.step;
    const firstError = params.errors.length > 0 ? params.errors[0] : null;
    let error: string | null = null;
    if (firstError !== null) {
        error = firstError.message;
        const position = params.ruleIds.indexOf(firstError.ruleId ?? "");
        if (firstError.ruleId !== null && position !== -1) {
            error = `Rule ${position + 1}: ${firstError.message}`;
        }
    }
```

and in the returned object `error,` replaces `error: firstError,`.

Modify `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts`: imports

```ts
import { getStepRuleIds } from "~/editor/model/getStepRuleIds.js";
import { getRuleErrorsFromSave } from "./getRuleErrorsFromSave.js";
```

in `buildFlow`, pass the rule ids to `buildStepCardVm` (after `errors: entry ? entry.errors : [],`):

```ts
                ruleIds: getStepRuleIds(step),
```

in `handleValidationFailure` replace

```ts
            this.applyServerStepError(stepId, failure.field, failure.message);
```

with

```ts
            this.applyServerStepError(stepId, failure);
```

and replace `applyServerStepError`:

```ts
    private applyServerStepError(stepId: string, failure: ValidationFailure): void {
        this.nameError = null;
        this.stepsError = null;
        const step = this.draft.steps.find(item => item.id === stepId) ?? null;
        const errors = getRuleErrorsFromSave(failure, step);
        this.stepErrors = [{ stepId, errors }];
        this.requestScroll(stepId);
    }
```

- [ ] **Step 4: Run the tests and expect them to pass**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
yarn test packages/app-workflows/src/editor/presentation/editor/ruleErrorsPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/stepDrawerPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/mapSaveError.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/buildStepCardVm.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ruleErrors.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/useCases/toOperationError.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.test.ts 2>&1 | tail -20
yarn test packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGatewayImpl.test.ts 2>&1 | tail -20
yarn test packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGatewayImpl.test.ts 2>&1 | tail -20
```

Expected: all pass.

- [ ] **Step 5: Run the existing tests covering the changed code, then the type checks**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.saveFailures.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.save.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.flow.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/model/validateWorkflowDraft.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawer.test.tsx 2>&1 | tail -20
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

Expected: pass, no type errors. The 9a `saveFailures` assertions on `getStepFieldErrors` now carry `ruleId: null` (the sed of Step 3 or Task 12 updated them).

- [ ] **Step 6: Pre-commit chain and commit**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
git add .
git restore --source=HEAD --staged --worktree .gitleaks.toml
git commit -m "feat(app-workflows): map rule errors of a save to their rule and tab" -m "A validation error carries the rule id, a schema error by index is converted to its rule's id when it is mapped, the assignment fields map to the form, getStepErrorTab names the tab of an error and the step card strip reads Rule {n}: {message}." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

**Contract notes:**
- The contract names `WorkflowErrorCode.ts` and "the Validation error data type" as files to change. `WorkflowErrorCode.ts` holds only the code table and needs no change; the data type is `ValidationFailure` in `mapSaveError.ts` (the data itself is untyped `unknown` in the DTO, so `ruleId` passes through every gateway unchanged, asserted for the shared use cases, the CMS and the WB gateway).
- `StepFieldError.ruleId` is optional after Task 12 (its validation errors carry it); this task makes it required and updates every literal (the sed list in Step 3).
- The contract says `openStep` "reads the tab through `getStepErrorTab`". It does not: the drawer presenter does when it opens (Task 16), from `getStepFieldErrors`; the editor presenter only keeps the errors, which `openStep` does not clear.
- Normal form of a rule error: `config.assignment.rules.<path>` with the index dropped plus `ruleId`; Task 16 maps by `ruleId` and `getRuleErrorField`, not by index. `getRuleErrorField` returns null for the card itself; Task 16 shows such an error on the card's border and strip and under the target field.

**Review fixes (sub-phase review):**
- The Task 12 hunk of `StepFieldError` (`ruleId?` optional) is now replaced exactly; the "skip when present" branch is gone because Task 12 never makes it required.
- The presenter tests answer `listUsers` for the targets; before, the default fake reported both users as missing, client validation (deleted user) blocked the save and `storeWorkflow` was never reached.
- `getStepErrorTab` names the Assignment tab only for the fields `getFormFieldPath` maps (an unknown `config.assignment.<x>` shows at the top and names no tab); a test pins it.
- The `mapSaveError.test.ts`, `stepDrawerPure.test.ts` and `buildStepCardVm.test.ts` edits name the exact existing cases they change.
