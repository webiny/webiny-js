### Task 18: People form, form data and patch, options and callbacks

R285, R293, R295, R302, R308, R309, R314; D21, D42, D69; design README 4 and `research-spec.md` 4.1, 4.2, 7 (tabs, hint); Review Focus 2, 5, 10. The People step form becomes a FormModel form with layout tabs `General`, `Assignment`, `Test routing`. `assignment` is a form `object()` with `strategy`, `allowManualPick` and `rules`; `getPeopleFormData` reads the stored assignment into those values and `getPeopleStepPatch` writes exactly the stored shape plus the edits (Task 9's `readAssignment` and `assignmentToConfig` do the parsing and the preservation). The drawer's `StepFormOptions` gains the slices the new renderers read, each with its plain callbacks. This task only defines the shapes and the empty defaults (`createEmptyStepFormOptions`); Task 16 fills `assignment`, `users`, `targetMembers`, `folders` and `references` in `StepDrawerPresenter.formOptions` from `StepDrawerSource`, and Task 22b adds `ruleErrors`, `ruleIssues` and `testRouting` from the drawer VM.

- **Spike (R293, run before this plan was written, against the real FormModel):** a form with `layout.tabs(...)`, an `object()` with `renderer("objectAccordionSingle", { container: false })` holding a `text()`, a `boolean()` and a `permissions()` field whose schema is `z.array(z.record(z.string(), z.unknown()))` carried a `RuleValue[]` (nested objects, `null` values, a `preserved` record) unchanged through `setData` and `getData`, stayed clean after `setData(..., { dirty: false })`, became dirty on `setValue`, reported `hasErrors` on the Assignment tab when `assignment.rules` was invalid, and `focusField("assignment.rules")` activated the Assignment tab (`focusField("color")` the General tab). A field that is in no layout still keeps its value in `getData()`. The first test of Step 1 pins all of it again as the spike; if it ever fails on execution, take the R293 fallback (the rule array lives in the drawer presenter, the form holds a text field that carries only the summary error; no app-admin change) and report it.
- **Form shape (R293, R302):** tabs node id `peopleTabs` (`PEOPLE_TABS_ID`), tab ids `general`, `assignment`, `testRouting` (`PEOPLE_TAB`). General holds the rows `title`, `color`, `description`, `teams`, `notifications` (so the existing `focusField("color")` keeps working); Assignment holds the row `assignment` (an object whose default inner layout is one row per child: `strategy`, `allowManualPick`, `rules`); Test routing holds the layout element `workflowTestRouting` (registered as `element:workflowTestRouting` by Task 22). Every new field has `validateAfterChange`, so an edit replaces a server message.
- **Read-only People step (R309):** `buildPeopleStepForm({ readOnly: true })` has no tabs (the five General rows only), every field disabled; its `assignment` field keeps its value in `getData()` (the field is in no layout). The drawer (Task 16) passes `readOnly` for a People step of an unavailable `review` row; `buildPeopleStepForm()` with no argument is the editable form.
- **Hint (R308):** the Reviewing teams hint is the design's full text. The requester-pick hint is the field's `note`: the stock `Switch` shows a field `description` only as a hover hint on its label, while the `note` is the visible line under the switch, as in the design.
- **Data (R295, R314):** `PeopleFormValues.assignment` is `AssignmentFormValues { strategy: AssignmentStrategy | null; allowManualPick: boolean; rules: RuleValue[] }`. `strategy` is `null` for a stored strategy the editor does not know (Task 9 keeps the raw value in `AssignmentValue.preserved`); the strategy renderer shows no card selected and `getPeopleStepPatch` writes the raw value back until the admin picks one. `getPeopleStepPatch` starts from `readAssignment(stored)` and replaces only `strategy`, `allowManualPick` and `rules`, so `AssignmentValue.preserved` and every rule's `preserved` survive.
- **Options slices (R291, R298, R299, R300, R307):** `StepFormOptions` gains `assignment`, `users`, `targetMembers`, `folders`, `references`, `ruleErrors`, `ruleIssues` and `testRouting`. Everything is plain data and plain functions (no React nodes), so MobX never deep-observes a fiber. Domain objects cross as data (`WorkflowUserSummary`, `AppFolder`, `RuleReferences`, `RuleIssue`) and the renderers map them to picker options (Task 19b). The `assignment` slice is new (see Contract notes): a layout element or a field renderer cannot read a sibling field, so the drawer hands the step's current reviewing team ids and strategy over.
- **No renderer is registered here:** the names (`workflowAssignmentStrategy`, `workflowRoutingRules`, `workflowUserPicker`, `workflowFolderPicker`) and the element name `workflowTestRouting` are declared; Tasks 19b, 20, 21b and 22 add the components and their `WorkflowEditorConfig` entries. Until Task 21b a People step's Assignment tab shows no rule list (FormView renders a field with no registered renderer as nothing); the phase merges only when every task is done.

**Files:** (`[STEP]` = `packages/app-workflows/src/editor/presentation`)
- Create: `[STEP]/stepForm/peopleTabs.ts`
- Create: `[STEP]/stepForm/assignmentFormMessages.ts`
- Modify: `[STEP]/stepForm/stepFormMessages.ts`
- Modify: `[STEP]/stepForm/stepFormRendererNames.ts`
- Modify: `[STEP]/stepForm/StepFormData.ts`
- Modify: `[STEP]/stepForm/getPeopleFormData.ts`
- Modify: `[STEP]/stepForm/getPeopleStepPatch.ts`
- Modify: `[STEP]/stepForm/buildPeopleStepForm.ts`
- Modify: `[STEP]/stepForm/StepFormOptions.ts`
- Modify: `[STEP]/stepForm/createEmptyStepFormOptions.ts`
- Modify: `[STEP]/stepDrawer/StepDrawerPresenter.ts` (one line: the new slices default to the empty ones until Task 16 and Task 22b fill them)
- Modify: `packages/app-workflows/src/editor/testing/findFormFieldVm.ts`
- Create: `[STEP]/stepForm/createEmptyStepFormOptions.test.ts`
- Modify: `[STEP]/stepForm/buildPeopleStepForm.test.ts` (replaced in full)
- Modify: `[STEP]/stepForm/renderers/TeamsPickerRenderer.test.tsx` (the hint)
- Modify: `[STEP]/stepDrawer/StepDrawer.test.tsx` (the FormView stub reads fields through tabs)
- Modify: `[STEP]/stepDrawer/StepDrawerPresenter.test.ts` (the loaded form data has the assignment)

**Interfaces:**
- Consumes (verified in the repo today): `buildCommonFields` (`buildCommonFields({ registry, descriptionPlaceholder, readOnly })` returns `title`, `color`, `description`, `notifications` builders), `validateAfterChange(path)`, `STEP_FORM_MESSAGES`, `STEP_FORM_RENDERER`, `readReviewConfig` (`~/editor/model/readReviewConfig.js`), `getCommonFormData`, `getCommonStepPatch`, `createTestFormModelFactory`, `createReviewStep` (`~/editor/testing/draftFixtures.js`), `StepFormListState`, FormModel `layout.tabs(id).tab(id, tab => ...)`, `layout.element(name)`, `form.focusField(path)`, `registry.object()`, `registry.boolean()`, `registry.permissions()` (the latter two are typed by module augmentation in `packages/app-admin/src/features/formModel/fieldTypes/BooleanFieldType.ts` and `PermissionsFieldType.ts`; the build in Step 5 proves it), `zod`.
- Consumes (earlier 9b tasks, as their task files specify; verify each against the file as that task left it): Task 9: `AssignmentStrategy`, `AssignmentValue { strategy: AssignmentStrategy | null; allowManualPick; rules; preserved }`, `RuleValue`, `readAssignment(assignment: Record<string, unknown> | null): AssignmentValue`, `assignmentToConfig(value: AssignmentValue): Record<string, unknown>` (all in `~/editor/model/assignment/`), fixtures `createRuleValue`, `createAssignmentValue` (`~/editor/testing/ruleFixtures.js`). Task 11: `RuleReferences`, `RuleIssue` (`~/editor/model/rules/`), `createEmptyRuleReferences()`. Task 6: `WorkflowUserSummary` (`~/editor/domain/types.js`). Task 8: `AppFolder` (`~/editor/WorkflowEditorAppAdapter.js`). Task 13: `TestRoutingResultVm` (`~/editor/model/testRouting/TestRoutingResultVm.js`).
- Produces: `PEOPLE_TABS_ID`, `PEOPLE_TAB` (`stepForm/peopleTabs.ts`); `ASSIGNMENT_FORM_MESSAGES` (all Assignment tab copy, used by Tasks 19b-21b); `buildPeopleStepForm(params?: PeopleStepFormParams)` with `PeopleStepFormParams { readOnly: boolean }`; `AssignmentFormValues`, `PeopleFormValues.assignment`; `STEP_FORM_RENDERER.assignmentStrategy | routingRules | userPicker | folderPicker | testRouting`; the slices `StepFormAssignmentOptions { stepTeamIds: string[]; strategy: string | null }`, `StepFormUsersOptions`, `StepFormTargetMembersOptions`, `StepFormFoldersOptions`, `StepFormReferencesOptions`, `StepFormRuleError`, `StepFormRuleErrorsOptions`, `StepFormRuleIssuesOptions`, `StepFormTestRoutingVm`, `StepFormTestRoutingOptions` (shapes in Step 3); `findFormFieldVm` that finds fields through tabs and objects.

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`. Type check: `yarn check:test:types -p app-workflows --report cli` and `yarn build -p @webiny/app-workflows --no-cache` (the package has `__tests__/`, so both; 8a R243).

- [ ] **Step 1: Write the failing tests**

Replace `packages/app-workflows/src/editor/presentation/stepForm/buildPeopleStepForm.test.ts` in full:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { FormModel } from "@webiny/app-admin";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { findFormFieldVm } from "~/editor/testing/findFormFieldVm.js";
import { createRuleValue } from "~/editor/testing/ruleFixtures.js";
import { buildPeopleStepForm } from "./buildPeopleStepForm.js";
import { getPeopleFormData } from "./getPeopleFormData.js";
import { getPeopleStepPatch } from "./getPeopleStepPatch.js";
import { PEOPLE_TAB } from "./peopleTabs.js";
import { PEOPLE_TABS_ID } from "./peopleTabs.js";
import { STEP_FORM_RENDERER } from "./stepFormRendererNames.js";

const createForm = (readOnly = false) => {
    return createTestFormModelFactory().create(buildPeopleStepForm({ readOnly }));
};

const getTabs = (form: FormModel.Interface): FormModel.TabsNodeVM => {
    const node = form.vm.layout[0];
    if (node.type !== "tabs") {
        throw new Error("The People form has no tabs.");
    }
    return node;
};

const getTab = (form: FormModel.Interface, id: string): FormModel.TabDefinitionVM => {
    const tab = getTabs(form).tabs.find(item => item.id === id);
    if (tab === undefined) {
        throw new Error(`The People form has no ${id} tab.`);
    }
    return tab;
};

const getRowFieldNames = (nodes: FormModel.TabDefinitionVM["layout"]): string[] => {
    const names: string[] = [];
    for (const node of nodes) {
        if (node.type === "row") {
            for (const field of node.fields) {
                names.push(field.name);
            }
        }
    }
    return names;
};

const STORED_RULE = {
    id: "rule-1",
    conditions: {
        requesterUserId: "user-1",
        requesterTeamId: "team-2",
        folder: { id: "folder-1", type: "cms:article", includeDescendants: true },
        modelId: "article"
    },
    target: { type: "user", id: "user-2" }
};

const STORED_ASSIGNMENT = {
    strategy: "roundRobin",
    allowManualPick: true,
    rules: [STORED_RULE]
};

const createStoredStep = (assignment: Record<string, unknown> = STORED_ASSIGNMENT) => {
    return createReviewStep({ config: { teams: ["team-1"], assignment } });
};

describe("buildPeopleStepForm (R293, R302, R308)", () => {
    it("carries the rule list unchanged through setData and getData, and marks it dirty when edited (the R293 spike)", () => {
        const form = createForm();
        const rules = [
            createRuleValue({
                id: "r1",
                requesterTeamId: "team-2",
                folder: { id: "folder-1", type: "cms:article", includeDescendants: true },
                target: { type: "user", id: "user-1" },
                preserved: { conditions: { modelId: "article" } }
            }),
            createRuleValue({ id: "r2", target: null })
        ];
        const values = {
            ...getPeopleFormData(createReviewStep()),
            assignment: { strategy: "leastLoaded", allowManualPick: true, rules }
        };

        form.setData(values, { dirty: false });

        expect(form.isDirty).toBe(false);
        expect(form.getData().assignment).toEqual({
            strategy: "leastLoaded",
            allowManualPick: true,
            rules
        });
        expect(JSON.parse(JSON.stringify(form.getData().assignment.rules))).toEqual(rules);

        form.field("assignment.rules").setValue([...rules, createRuleValue({ id: "r3" })]);

        expect(form.isDirty).toBe(true);
        const edited: RuleValue[] = form.getData().assignment.rules;
        expect(edited.map(rule => rule.id)).toEqual(["r1", "r2", "r3"]);
    });

    it("has the General, Assignment and Test routing tabs in one tabs node", () => {
        const form = createForm();

        expect(form.vm.layout).toHaveLength(1);
        const tabs = getTabs(form);

        expect(tabs.id).toBe(PEOPLE_TABS_ID);
        expect(tabs.tabs.map(tab => tab.id)).toEqual([
            PEOPLE_TAB.general,
            PEOPLE_TAB.assignment,
            PEOPLE_TAB.testRouting
        ]);
        expect(tabs.tabs.map(tab => tab.label)).toEqual(["General", "Assignment", "Test routing"]);
        expect(tabs.activeTabId).toBe(PEOPLE_TAB.general);
    });

    it("puts the common fields and the teams in General, in the design order", () => {
        const names = getRowFieldNames(getTab(createForm(), PEOPLE_TAB.general).layout);

        expect(names).toEqual(["title", "color", "description", "teams", "notifications"]);
    });

    it("puts the assignment object in Assignment, with strategy, the toggle and the rules in that order", () => {
        const form = createForm();

        expect(getRowFieldNames(getTab(form, PEOPLE_TAB.assignment).layout)).toEqual([
            "assignment"
        ]);
        const assignment = findFormFieldVm(form.vm, "assignment");
        const object = assignment as FormModel.ObjectFieldVM;

        expect(object.fields.map(field => field.name)).toEqual([
            "strategy",
            "allowManualPick",
            "rules"
        ]);
    });

    it("puts the Test routing element in its tab and no field", () => {
        const layout = getTab(createForm(), PEOPLE_TAB.testRouting).layout;

        expect(layout).toHaveLength(1);
        expect(layout[0].type).toBe("element");
        expect(layout[0]).toMatchObject({ renderer: STEP_FORM_RENDERER.testRouting });
    });

    it("describes the teams field with the design's full hint (R308)", () => {
        const teams = createForm().field("teams").vm;

        expect(teams.label).toBe("Reviewing teams");
        expect(teams.description).toBe(
            "Members of these teams can review. Routing rules can narrow a review to one team or person. Set up who is chosen on the Assignment tab."
        );
        expect(teams.renderer).toBe(STEP_FORM_RENDERER.teams);
        expect(teams.isList).toBe(true);
    });

    it("describes the strategy, the toggle and the rule list", () => {
        const form = createForm();
        const strategy = form.field("assignment.strategy").vm;
        const toggle = form.field("assignment.allowManualPick").vm;
        const rules = form.field("assignment.rules").vm;

        expect(strategy.label).toBe("Strategy");
        expect(strategy.renderer).toBe(STEP_FORM_RENDERER.assignmentStrategy);
        expect(toggle.label).toBe("Let the requester pick a reviewer");
        expect(toggle.note).toBe(
            "The requester can choose a person from this step's eligible reviewers when requesting a review. Picks are checked again when the step is reached."
        );
        expect(toggle.renderer).toBe("switch");
        expect(rules.label).toBe("Routing rules");
        expect(rules.renderer).toBe(STEP_FORM_RENDERER.routingRules);
    });

    it("does not require a rule (the stock permissions schema needs at least one)", async () => {
        const form = createForm();
        const rules = form.field("assignment.rules");

        expect(await rules.validate({ force: true })).toBe(true);
    });

    it("uses the People description placeholder", () => {
        const form = createForm();

        expect(form.field("description").vm.placeholder).toBe(
            "What reviewers should look for in this step"
        );
    });

    it("requires at least one team (QBZ-12)", async () => {
        const form = createForm();
        const teams = form.field("teams");

        expect(await teams.validate({ force: true })).toBe(false);
        expect(teams.vm.validation.message).toBe("Choose at least one reviewing team.");

        teams.setValue(["team-1"]);

        expect(await teams.validate({ force: true })).toBe(true);
    });

    it("loads a step without becoming dirty and reads back what it loaded", () => {
        const form = createForm();
        const step = createReviewStep({ description: "Check claims" });

        form.setData(getPeopleFormData(step), { dirty: false });

        expect(form.isDirty).toBe(false);
        expect(form.getData()).toEqual({
            title: "Legal sign-off",
            color: "var(--color-primary-500)",
            description: "Check claims",
            teams: ["team-1"],
            notifications: ["e-mail"],
            assignment: { strategy: "none", allowManualPick: false, rules: [] }
        });
    });

    it("marks the Assignment tab, and only it, when the rule list holds an error (R302)", async () => {
        const form = createForm();
        form.setData(getPeopleFormData(createReviewStep()), { dirty: false });

        form.field("assignment.rules").setValidation({
            isValid: false,
            message: "Rule 1: Choose who this rule assigns to."
        });

        expect(getTabs(form).tabs.map(tab => tab.hasErrors)).toEqual([false, true, false]);

        await form.field("assignment.rules").validate({ force: true });

        expect(getTabs(form).tabs.map(tab => tab.hasErrors)).toEqual([false, false, false]);
    });

    it("activates the tab of a field on focusField (R302)", () => {
        const form = createForm();

        form.focusField("assignment.rules");
        expect(getTabs(form).activeTabId).toBe(PEOPLE_TAB.assignment);

        form.focusField("color");
        expect(getTabs(form).activeTabId).toBe(PEOPLE_TAB.general);
    });

    it("has no tabs and disables every field for a read-only step (R309)", () => {
        const form = createForm(true);
        form.setData(getPeopleFormData(createStoredStep()), { dirty: false });

        expect(form.vm.layout.map(node => node.type)).toEqual(["row", "row", "row", "row", "row"]);
        expect(form.field("title").vm.disabled).toBe(true);
        expect(form.field("teams").vm.disabled).toBe(true);
        expect(form.field("assignment.strategy").vm.disabled).toBe(true);
        expect(form.field("assignment.rules").vm.disabled).toBe(true);
        expect(form.isDirty).toBe(false);
        expect(form.getData().assignment.rules).toHaveLength(1);
    });
});

describe("getPeopleFormData (R295, R314)", () => {
    it("lists the stored team ids and ignores anything that is not a string", () => {
        const step = createReviewStep({ config: { teams: ["team-1", 7, null, "team-2"] } });

        expect(getPeopleFormData(step).teams).toEqual(["team-1", "team-2"]);
    });

    it("is an empty list for a step with no teams", () => {
        expect(getPeopleFormData(createReviewStep({ config: {} })).teams).toEqual([]);
        expect(getPeopleFormData(createReviewStep({ config: null })).teams).toEqual([]);
    });

    it("reads the review defaults for a step with no assignment", () => {
        const step = createReviewStep({ config: { teams: ["team-1"] } });

        expect(getPeopleFormData(step).assignment).toEqual({
            strategy: "none",
            allowManualPick: false,
            rules: []
        });
    });

    it("reads the stored strategy, toggle and rules into the typed values", () => {
        const { assignment } = getPeopleFormData(createStoredStep());

        expect(assignment.strategy).toBe("roundRobin");
        expect(assignment.allowManualPick).toBe(true);
        expect(assignment.rules).toEqual([
            {
                id: "rule-1",
                requesterUserId: "user-1",
                requesterTeamId: "team-2",
                folder: { id: "folder-1", type: "cms:article", includeDescendants: true },
                target: { type: "user", id: "user-2" },
                preserved: { conditions: { modelId: "article" } }
            }
        ]);
    });

    it("reads an unknown stored strategy as no strategy", () => {
        const step = createStoredStep({ ...STORED_ASSIGNMENT, strategy: "weighted" });

        expect(getPeopleFormData(step).assignment.strategy).toBeNull();
    });
});

describe("getPeopleStepPatch (R293, R295, R314, Review Focus 2)", () => {
    const createValues = (step = createStoredStep()) => {
        return { ...getPeopleFormData(step), title: "Legal review" };
    };

    it("writes exactly the People config keys: teams and assignment", () => {
        const step = createStoredStep();
        const patch = getPeopleStepPatch(step, createValues(step));

        expect(Object.keys(patch.config as Record<string, unknown>).sort()).toEqual([
            "assignment",
            "teams"
        ]);
        expect(patch.title).toBe("Legal review");
    });

    it("writes the stored assignment back unchanged when nothing was edited", () => {
        const step = createStoredStep();

        const patch = getPeopleStepPatch(step, createValues(step));

        expect(patch.config).toEqual({ teams: ["team-1"], assignment: STORED_ASSIGNMENT });
    });

    it("keeps an unknown assignment key, a condition the editor does not edit and an unknown strategy", () => {
        const stored = { ...STORED_ASSIGNMENT, strategy: "weighted", futureKey: { keep: true } };
        const step = createStoredStep(stored);

        const patch = getPeopleStepPatch(step, createValues(step));

        expect(patch.config).toEqual({ teams: ["team-1"], assignment: stored });
    });

    it("writes the picked strategy over an unknown stored one", () => {
        const step = createStoredStep({ ...STORED_ASSIGNMENT, strategy: "weighted" });
        const values = createValues(step);
        values.assignment.strategy = "leastLoaded";

        const patch = getPeopleStepPatch(step, values);

        expect(patch.config).toEqual({
            teams: ["team-1"],
            assignment: { ...STORED_ASSIGNMENT, strategy: "leastLoaded" }
        });
    });

    it("writes the edited strategy, toggle and an emptied rule list", () => {
        const step = createStoredStep();
        const values = createValues(step);
        values.assignment = { strategy: "leastLoaded", allowManualPick: false, rules: [] };

        const patch = getPeopleStepPatch(step, values);

        expect(patch.config).toEqual({
            teams: ["team-1"],
            assignment: { strategy: "leastLoaded", allowManualPick: false, rules: [] }
        });
    });

    it("writes one edited target and leaves every other key of the rule as stored", () => {
        const step = createStoredStep();
        const values = createValues(step);
        values.assignment.rules[0] = {
            ...values.assignment.rules[0],
            target: { type: "team", id: "team-2" }
        };

        const patch = getPeopleStepPatch(step, values);

        expect(patch.config).toEqual({
            teams: ["team-1"],
            assignment: {
                ...STORED_ASSIGNMENT,
                rules: [{ ...STORED_RULE, target: { type: "team", id: "team-2" } }]
            }
        });
    });

    it("writes a new rule as an id, empty conditions and its target", () => {
        const step = createStoredStep();
        const values = createValues(step);
        values.assignment.rules.push(
            createRuleValue({ id: "rule-2", target: { type: "team", id: "team-1" } })
        );

        const patch = getPeopleStepPatch(step, values);

        expect(patch.config).toEqual({
            teams: ["team-1"],
            assignment: {
                ...STORED_ASSIGNMENT,
                rules: [
                    STORED_RULE,
                    { id: "rule-2", conditions: {}, target: { type: "team", id: "team-1" } }
                ]
            }
        });
    });

    it("defaults the assignment only when the step has none", () => {
        const step = createReviewStep({ config: { teams: ["team-1"] } });

        const patch = getPeopleStepPatch(step, createValues(step));

        expect(patch.config).toEqual({
            teams: ["team-1"],
            assignment: { strategy: "none", allowManualPick: false, rules: [] }
        });
    });

    it("includes the common fields and treats missing teams as an empty list", () => {
        const step = createStoredStep();
        const patch = getPeopleStepPatch(step, { ...createValues(step), teams: null });

        expect(patch.title).toBe("Legal review");
        expect(patch.config).toMatchObject({ teams: [] });
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/createEmptyStepFormOptions.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createEmptyStepFormOptions } from "./createEmptyStepFormOptions.js";

describe("createEmptyStepFormOptions (the 9b slices)", () => {
    it("has every 9b list loaded and empty, with callbacks that do nothing", () => {
        const options = createEmptyStepFormOptions();

        expect(options.assignment).toEqual({ stepTeamIds: [], strategy: null });
        expect(options.users).toMatchObject({ loading: false, failed: false, items: [], selected: [] });
        expect(options.targetMembers).toMatchObject({
            loading: false,
            failed: false,
            items: [],
            selected: []
        });
        expect(options.folders).toMatchObject({
            loading: false,
            failed: false,
            items: [],
            folderType: ""
        });
        expect(options.references).toMatchObject({ loading: false, failed: false });
        expect(options.references.users.size).toBe(0);
        expect(options.references.teams.size).toBe(0);
        expect(options.references.folders.size).toBe(0);
        expect(options.references.userTeamIds.size).toBe(0);
        expect(options.ruleErrors.items).toEqual([]);
        expect(options.ruleIssues.items).toEqual([]);
        expect(options.testRouting.vm).toMatchObject({
            requesterId: null,
            folderId: null,
            canRun: false,
            status: "idle",
            stale: false,
            result: null,
            errorMessage: null
        });
    });

    it("gives every callback a function that is safe to call", () => {
        const options = createEmptyStepFormOptions();

        expect(() => options.users.searchUsers("a")).not.toThrow();
        expect(() => options.users.retry()).not.toThrow();
        expect(() => options.targetMembers.searchTargetMembers(["team-1"], "a")).not.toThrow();
        expect(() => options.targetMembers.retry()).not.toThrow();
        expect(() => options.folders.retry()).not.toThrow();
        expect(() => options.references.retry()).not.toThrow();
        expect(() => options.ruleErrors.clearRuleError("rule-1")).not.toThrow();
        expect(() => options.testRouting.setTestRequester("user-1")).not.toThrow();
        expect(() => options.testRouting.setTestFolder(null)).not.toThrow();
        expect(() => options.testRouting.runTest()).not.toThrow();
    });
});
```

In `packages/app-workflows/src/editor/presentation/stepForm/renderers/TeamsPickerRenderer.test.tsx`, replace the hint expectation. Before:

```ts
        expect(picker.getAttribute("data-description")).toBe("Members of these teams can review.");
```

After:

```ts
        expect(picker.getAttribute("data-description")).toBe(
            "Members of these teams can review. Routing rules can narrow a review to one team or person. Set up who is chosen on the Assignment tab."
        );
```

In `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawer.test.tsx`, the FormView stub lists fields from rows only; the People form is now one tabs node. Before:

```ts
interface FormViewStubFieldVm {
    name: string;
}

interface FormViewStubNodeVm {
    type: string;
    fields?: FormViewStubFieldVm[];
}
```

After:

```ts
interface FormViewStubFieldVm {
    name: string;
}

interface FormViewStubTabVm {
    layout: FormViewStubNodeVm[];
}

interface FormViewStubNodeVm {
    type: string;
    fields?: FormViewStubFieldVm[];
    tabs?: FormViewStubTabVm[];
}
```

Before:

```ts
    const FormView = (props: FormViewStubProps) => {
        const options = useStepFormOptions();
        const names: string[] = [];
        for (const node of props.form.layout) {
            for (const field of node.fields ?? []) {
                names.push(field.name);
            }
        }
```

After:

```ts
    const collectNames = (nodes: FormViewStubNodeVm[], names: string[]): void => {
        for (const node of nodes) {
            for (const field of node.fields ?? []) {
                names.push(field.name);
            }
            for (const tab of node.tabs ?? []) {
                collectNames(tab.layout, names);
            }
        }
    };
    const FormView = (props: FormViewStubProps) => {
        const options = useStepFormOptions();
        const names: string[] = [];
        collectNames(props.form.layout, names);
```

And the expectation in `renders the form and provides the options context to it`. Before:

```ts
        expect(form.getAttribute("data-fields")).toBe(
            "title,color,description,teams,notifications"
        );
```

After:

```ts
        expect(form.getAttribute("data-fields")).toBe(
            "title,color,description,teams,notifications,assignment"
        );
```

In `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.test.ts`, the test `opens a People step with the form loaded and not dirty` compares the whole form data, which now has the assignment. Before:

```ts
            teams: ["team-1"],
            notifications: ["e-mail"]
        });
    });

    it("names the step type and says it cannot be changed (D91)", () => {
```

After:

```ts
            teams: ["team-1"],
            notifications: ["e-mail"],
            assignment: { strategy: "none", allowManualPick: false, rules: [] }
        });
    });

    it("names the step type and says it cannot be changed (D91)", () => {
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/buildPeopleStepForm.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/createEmptyStepFormOptions.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/TeamsPickerRenderer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawer.test.tsx 2>&1 | tail -30
```

Expected: `buildPeopleStepForm.test.ts` fails with `Failed to resolve import "./peopleTabs.js"`. `createEmptyStepFormOptions.test.ts` fails on its first expectation (`expected undefined to deeply equal { stepTeamIds: [], strategy: null }`: the options have no `assignment` slice yet). `TeamsPickerRenderer.test.tsx` fails on the `data-description` expectation (the old one-sentence hint). `StepDrawer.test.tsx` and the `StepDrawerPresenter.test.ts` case above still pass at this point (the form has no tabs and no assignment yet); both start failing after Step 3 unless their hunks are applied.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/stepForm/peopleTabs.ts`:

```ts
/*
 * The ids of the People step form's layout parts (R293, R302): the tabs node and its three tabs.
 * The drawer and the tests address a tab by these; `activeTabId` of the tabs node is one of them.
 */
export const PEOPLE_TABS_ID = "peopleTabs";

export const PEOPLE_TAB = {
    general: "general",
    assignment: "assignment",
    testRouting: "testRouting"
} as const;
```

Create `packages/app-workflows/src/editor/presentation/stepForm/assignmentFormMessages.ts`:

```ts
/*
 * Copy of the People step's Assignment tab and its pickers (R285, R297, R307, R308, R313;
 * `research-spec.md` 4.2 and 7). Strings with a parameter are functions so the sentence stays whole.
 */
export const ASSIGNMENT_FORM_MESSAGES = {
    tabGeneral: "General",
    tabAssignment: "Assignment",
    tabTestRouting: "Test routing",
    strategyLabel: "Strategy",
    allowManualPickLabel: "Let the requester pick a reviewer",
    allowManualPickHint:
        "The requester can choose a person from this step's eligible reviewers when requesting a review. Picks are checked again when the step is reached.",
    rulesLabel: "Routing rules",
    rulesHint: "The first matching rule wins. If no rule matches, the strategy decides.",
    addRule: "Add rule",
    emptyRulesLead: "No rules. ",
    emptyRulesPool: "Reviews wait in the team pool.",
    emptyRulesStrategy: "The strategy picks the reviewer.",
    moveRuleUp: "Move rule up",
    moveRuleDown: "Move rule down",
    deleteRule: "Delete rule",
    requesterUserLabel: "Requester is",
    anyUser: "Anyone",
    requesterTeamLabel: "Requester is in team",
    anyTeam: "Any team",
    folderLabel: "Content is in folder",
    anyFolder: "Any folder",
    removeFolder: "Remove",
    removeFolderTitle: "Remove the folder condition",
    restrictedFolderHint:
        "You can't see this folder. The condition stays as it is unless you remove it.",
    includeSubfolders: "Include subfolders",
    targetLabel: "Then assign to",
    targetPlaceholder: "Search reviewers or teams",
    targetHint: "Only members of this step's reviewing teams, or one of those teams.",
    searchUsersPlaceholder: "Search users",
    searchFoldersPlaceholder: "Search folders",
    ruleTitle: (position: number): string => {
        return `Rule ${position}`;
    },
    teamPool: (team: string): string => {
        return `${team} team pool`;
    },
    notInReviewingTeams: (name: string): string => {
        return `${name} (not in reviewing teams)`;
    },
    ruleMoved: (position: number, total: number): string => {
        return `Rule moved to position ${position} of ${total}.`;
    }
} as const;
```

In `packages/app-workflows/src/editor/presentation/stepForm/stepFormMessages.ts`, before:

```ts
    teamsHint: "Members of these teams can review.",
```

After:

```ts
    teamsHint:
        "Members of these teams can review. Routing rules can narrow a review to one team or person. Set up who is chosen on the Assignment tab.",
```

Replace `packages/app-workflows/src/editor/presentation/stepForm/stepFormRendererNames.ts` in full:

```ts
/*
 * The names of the step form renderers, registered by `WorkflowEditorConfig` and used by the
 * builders. `testRouting` is a layout element, registered as `element:workflowTestRouting`.
 */
export const STEP_FORM_RENDERER = {
    colour: "workflowStepColour",
    teams: "workflowTeamsPicker",
    transports: "workflowTransports",
    automations: "workflowAutomationCards",
    aiModel: "workflowAiModel",
    aiTools: "workflowAiTools",
    assignmentStrategy: "workflowAssignmentStrategy",
    routingRules: "workflowRoutingRules",
    userPicker: "workflowUserPicker",
    folderPicker: "workflowFolderPicker",
    testRouting: "workflowTestRouting"
} as const;

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        workflowStepColour: { fieldType: "text"; settings: undefined };
        workflowTeamsPicker: { fieldType: "text"; settings: undefined };
        workflowTransports: { fieldType: "text"; settings: undefined };
        workflowAutomationCards: { fieldType: "text"; settings: undefined };
        workflowAiModel: { fieldType: "text"; settings: undefined };
        workflowAiTools: { fieldType: "text"; settings: undefined };
        workflowAssignmentStrategy: { fieldType: "text"; settings: undefined };
        workflowRoutingRules: { fieldType: "permissions"; settings: undefined };
        workflowUserPicker: { fieldType: "text"; settings: undefined };
        workflowFolderPicker: { fieldType: "text"; settings: undefined };
    }
}
```

In `packages/app-workflows/src/editor/presentation/stepForm/StepFormData.ts`, before:

```ts
export interface PeopleFormValues extends CommonFormValues {
    teams: string[] | null;
}
```

After:

```ts
// The Assignment tab as form values (R293); `strategy` is null for a stored strategy the editor does not know (R314).
export interface AssignmentFormValues {
    strategy: AssignmentStrategy | null;
    allowManualPick: boolean;
    rules: RuleValue[];
}

export interface PeopleFormValues extends CommonFormValues {
    teams: string[] | null;
    assignment: AssignmentFormValues;
}
```

and add the two imports at the top of the file (the file has no imports today; the comment line stays first):

```ts
import type { AssignmentStrategy } from "~/editor/model/assignment/AssignmentStrategy.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
```

Replace `packages/app-workflows/src/editor/presentation/stepForm/getPeopleFormData.ts` in full:

```ts
import type { EditorStep } from "~/editor/domain/types.js";
import { readAssignment } from "~/editor/model/assignment/readAssignment.js";
import { readReviewConfig } from "~/editor/model/readReviewConfig.js";
import type { PeopleFormValues } from "./StepFormData.js";
import { getCommonFormData } from "./getCommonFormData.js";

/*
 * The People step as form values: the common fields, the stored team ids (strings only) and the
 * assignment read into typed values (R293). What the editor does not edit stays in the
 * `preserved` records of the typed value, which `getPeopleStepPatch` reads again from the step.
 */
export const getPeopleFormData = (step: EditorStep): PeopleFormValues => {
    const { teams, assignment } = readReviewConfig(step.config);
    const common = getCommonFormData(step);
    const stored = readAssignment(assignment);

    return {
        ...common,
        teams,
        assignment: {
            strategy: stored.strategy,
            allowManualPick: stored.allowManualPick,
            rules: stored.rules
        }
    };
};
```

Replace `packages/app-workflows/src/editor/presentation/stepForm/getPeopleStepPatch.ts` in full:

```ts
import { toJS } from "mobx";
import type { EditorStep } from "~/editor/domain/types.js";
import type { AssignmentValue } from "~/editor/model/assignment/AssignmentValue.js";
import { assignmentToConfig } from "~/editor/model/assignment/assignmentToConfig.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import { readAssignment } from "~/editor/model/assignment/readAssignment.js";
import type { EditorStepPatch } from "~/editor/model/EditorStepPatch.js";
import { readReviewConfig } from "~/editor/model/readReviewConfig.js";
import type { PeopleFormValues } from "./StepFormData.js";
import { getCommonStepPatch } from "./getCommonStepPatch.js";

/*
 * What Done writes for a People step: the common fields and the config `{ teams, assignment }`
 * (R293, R295, R314, Review Focus 2). The assignment starts from the stored one read into typed
 * values and only `strategy`, `allowManualPick` and `rules` are replaced by the form's values, so
 * every key the editor does not edit (unknown assignment keys, the `preserved` data of a rule, an
 * unknown strategy while none was picked) is written back as stored. A step with no assignment
 * gets the review defaults.
 */
export const getPeopleStepPatch = (step: EditorStep, values: PeopleFormValues): EditorStepPatch => {
    const { assignment } = readReviewConfig(step.config);
    const stored = readAssignment(assignment);
    const common = getCommonStepPatch(step, values);

    // The rules come from the form field, which holds observable data.
    const rules: RuleValue[] = toJS(values.assignment.rules);
    const edited: AssignmentValue = {
        ...stored,
        strategy: values.assignment.strategy,
        allowManualPick: values.assignment.allowManualPick,
        rules
    };
    const config = assignmentToConfig(edited);

    return { ...common, config: { teams: values.teams ?? [], assignment: config } };
};
```

Replace `packages/app-workflows/src/editor/presentation/stepForm/buildPeopleStepForm.ts` in full:

```ts
import { z } from "zod";
import type { FormModelFactory } from "@webiny/app-admin";
import { ASSIGNMENT_FORM_MESSAGES } from "./assignmentFormMessages.js";
import { buildCommonFields } from "./buildCommonFields.js";
import { PEOPLE_TAB } from "./peopleTabs.js";
import { PEOPLE_TABS_ID } from "./peopleTabs.js";
import { STEP_FORM_MESSAGES } from "./stepFormMessages.js";
import { STEP_FORM_RENDERER } from "./stepFormRendererNames.js";
import { validateAfterChange } from "./validateAfterChange.js";

// The rules are `RuleValue`s, plain JSON: the field takes any list of records, and an empty list is valid (R293).
const rulesSchema = z.array(z.record(z.string(), z.unknown()));

export interface PeopleStepFormParams {
    /*
     * A People step that cannot be edited (the `review` type is unavailable, teams are off, R309):
     * every field is disabled and the form has no tabs.
     */
    readOnly: boolean;
}

const EDITABLE: PeopleStepFormParams = { readOnly: false };

function buildAssignmentField(
    registry: FormModelFactory.FieldBuilderRegistry,
    readOnly: boolean
): FormModelFactory.FieldBuilder {
    return registry
        .object()
        .label(ASSIGNMENT_FORM_MESSAGES.tabAssignment)
        .renderer("objectAccordionSingle", { container: false })
        .fields(nested => {
            const afterStrategyChange = validateAfterChange("assignment.strategy");
            const afterAllowManualPickChange = validateAfterChange("assignment.allowManualPick");
            const afterRulesChange = validateAfterChange("assignment.rules");

            const strategy = nested
                .text()
                .label(ASSIGNMENT_FORM_MESSAGES.strategyLabel)
                .renderer(STEP_FORM_RENDERER.assignmentStrategy)
                .afterChange(afterStrategyChange)
                .disabled(readOnly);

            const allowManualPick = nested
                .boolean()
                .label(ASSIGNMENT_FORM_MESSAGES.allowManualPickLabel)
                .note(ASSIGNMENT_FORM_MESSAGES.allowManualPickHint)
                .afterChange(afterAllowManualPickChange)
                .disabled(readOnly);

            const rules = nested
                .permissions()
                .label(ASSIGNMENT_FORM_MESSAGES.rulesLabel)
                .schema(rulesSchema)
                .renderer(STEP_FORM_RENDERER.routingRules)
                .afterChange(afterRulesChange)
                .disabled(readOnly);

            return { strategy, allowManualPick, rules };
        });
}

/*
 * The People step form (R270, R293, R302, R308): the common fields, the reviewing teams and the
 * `assignment` object (strategy, the requester-pick toggle and the routing rules) in layout tabs
 * `General`, `Assignment` and `Test routing`. A read-only step has the General rows and no tabs.
 */
export const buildPeopleStepForm = (
    params: PeopleStepFormParams = EDITABLE
): FormModelFactory.Config => {
    const { readOnly } = params;

    return {
        fields: registry => {
            const common = buildCommonFields({
                registry,
                descriptionPlaceholder: STEP_FORM_MESSAGES.peopleDescriptionPlaceholder,
                readOnly
            });

            const teams = registry
                .text()
                .list()
                .label("Reviewing teams")
                .description(STEP_FORM_MESSAGES.teamsHint)
                .required(STEP_FORM_MESSAGES.teamsRequired)
                .renderer(STEP_FORM_RENDERER.teams)
                .afterChange(validateAfterChange("teams"))
                .disabled(readOnly);

            return {
                title: common.title,
                color: common.color,
                description: common.description,
                teams,
                notifications: common.notifications,
                assignment: buildAssignmentField(registry, readOnly)
            };
        },
        layout: layout => {
            if (readOnly) {
                return [
                    layout.row("title"),
                    layout.row("color"),
                    layout.row("description"),
                    layout.row("teams"),
                    layout.row("notifications")
                ];
            }

            const tabs = layout
                .tabs(PEOPLE_TABS_ID)
                .tab(PEOPLE_TAB.general, tab => {
                    tab.label(ASSIGNMENT_FORM_MESSAGES.tabGeneral).layout(general => [
                        general.row("title"),
                        general.row("color"),
                        general.row("description"),
                        general.row("teams"),
                        general.row("notifications")
                    ]);
                })
                .tab(PEOPLE_TAB.assignment, tab => {
                    tab.label(ASSIGNMENT_FORM_MESSAGES.tabAssignment).layout(assignment => [
                        assignment.row("assignment")
                    ]);
                })
                .tab(PEOPLE_TAB.testRouting, tab => {
                    tab.label(ASSIGNMENT_FORM_MESSAGES.tabTestRouting).layout(testRouting => [
                        testRouting.element(STEP_FORM_RENDERER.testRouting)
                    ]);
                });

            return [tabs];
        }
    };
};
```

In `packages/app-workflows/src/editor/presentation/stepForm/StepFormOptions.ts`, replace the import line at the top. Before:

```ts
import type { PickerOption } from "~/components/picker/PickerOption.js";
```

After:

```ts
import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";
import type { TestRoutingResultVm } from "~/editor/model/testRouting/TestRoutingResultVm.js";
import type { AppFolder } from "~/editor/WorkflowEditorAppAdapter.js";
```

Then, before:

```ts
// The one value the drawer provides to every renderer of a step form (R234: the presenter owns the data).
export interface StepFormOptions {
    teams: StepFormTeamsOptions;
    transports: StepFormTransportsOptions;
    automations: StepFormAutomationsOptions;
    aiModels: StepFormAiModelsOptions;
    aiTools: StepFormAiToolsOptions;
}
```

After:

```ts
/*
 * What a People step's rule list and pickers need of the step as the form holds it now (R293): a
 * layout element or a field renderer cannot read a sibling field, so the drawer hands them over.
 */
export interface StepFormAssignmentOptions {
    // The ids of the reviewing teams, as the `teams` field holds them now.
    stepTeamIds: string[];
    // The `assignment.strategy` field's value; null for a stored strategy the editor does not know.
    strategy: string | null;
}

// The user search (R307): the requester pickers and the automation `user` hint.
export interface StepFormUsersOptions extends StepFormListState {
    // The search results, already limited by the picker.
    items: WorkflowUserSummary[];
    // The users known by id (picked, saved or resolved), so a picker keeps its label when a search narrows the list.
    selected: WorkflowUserSummary[];
    searchUsers: (query: string) => void;
}

// The members of the reviewing teams (R307): the options of a rule's target picker.
export interface StepFormTargetMembersOptions extends StepFormListState {
    items: WorkflowUserSummary[];
    selected: WorkflowUserSummary[];
    searchTargetMembers: (stepTeamIds: string[], search: string) => void;
}

// The folders of the app (R292): the complete list, so a picker filters it itself.
export interface StepFormFoldersOptions extends StepFormListState {
    items: AppFolder[];
    // The folder type a rule stores when the admin picks a folder (`cms:<modelId>`, `wb:page`).
    folderType: string;
}

// Saved user, team and folder ids resolved to labels (R298); `loading` and `failed` describe the resolution.
export interface StepFormReferencesOptions extends StepFormListState, RuleReferences {}

// A server rule error, mapped to its rule and field by the drawer (R303).
export interface StepFormRuleError {
    ruleId: string;
    field: RuleIssue["field"];
    message: string;
}

export interface StepFormRuleErrorsOptions {
    items: StepFormRuleError[];
    // Editing a rule or removing it clears that rule's error and nothing else (R303).
    clearRuleError: (ruleId: string) => void;
}

// The live rule issues of the open step (R299): errors and warnings per rule and field.
export interface StepFormRuleIssuesOptions {
    items: RuleIssue[];
}

/*
 * The Test routing state of the open step (R300): the shape of Task 17's `TestRoutingVm`, declared
 * here so the form code does not depend on the drawer presenter (Task 18 runs before Tasks 16
 * and 17, which need its form). The two are structurally the same type.
 */
export interface StepFormTestRoutingVm {
    requesterId: string | null;
    folderId: string | null;
    canRun: boolean;
    hint: string | null;
    buttonLabel: "Test routing" | "Testing…";
    status: "idle" | "running" | "done" | "failed";
    stale: boolean;
    result: TestRoutingResultVm | null;
    errorMessage: string | null;
}

// The Test routing slice: the state and its plain callbacks.
export interface StepFormTestRoutingOptions {
    vm: StepFormTestRoutingVm;
    setTestRequester: (id: string | null) => void;
    setTestFolder: (id: string | null) => void;
    runTest: () => void;
}

// The one value the drawer provides to every renderer of a step form (R234: the presenter owns the data).
export interface StepFormOptions {
    teams: StepFormTeamsOptions;
    transports: StepFormTransportsOptions;
    automations: StepFormAutomationsOptions;
    aiModels: StepFormAiModelsOptions;
    aiTools: StepFormAiToolsOptions;
    assignment: StepFormAssignmentOptions;
    users: StepFormUsersOptions;
    targetMembers: StepFormTargetMembersOptions;
    folders: StepFormFoldersOptions;
    references: StepFormReferencesOptions;
    ruleErrors: StepFormRuleErrorsOptions;
    ruleIssues: StepFormRuleIssuesOptions;
    testRouting: StepFormTestRoutingOptions;
}
```

Replace `packages/app-workflows/src/editor/presentation/stepForm/createEmptyStepFormOptions.ts` in full:

```ts
import { createEmptyRuleReferences } from "~/editor/model/rules/createEmptyRuleReferences.js";
import type { StepFormOptions } from "./StepFormOptions.js";

const noop = (): void => undefined;

// The options of a closed drawer, and the defaults of the tests: every list loaded and empty.
export const createEmptyStepFormOptions = (): StepFormOptions => {
    return {
        teams: {
            loading: false,
            failed: false,
            retry: noop,
            options: [],
            selected: [],
            search: noop
        },
        transports: { loading: false, failed: false, retry: noop, options: [] },
        automations: {
            loading: false,
            failed: false,
            retry: noop,
            options: [],
            emptyText: "No automations are available for this model.",
            warning: null,
            settingsWarning: null,
            select: noop
        },
        aiModels: {
            loading: false,
            failed: false,
            retry: noop,
            options: [],
            selected: null,
            empty: false,
            search: noop
        },
        aiTools: { loading: false, failed: false, retry: noop, options: [] },
        assignment: { stepTeamIds: [], strategy: null },
        users: {
            loading: false,
            failed: false,
            retry: noop,
            items: [],
            selected: [],
            searchUsers: noop
        },
        targetMembers: {
            loading: false,
            failed: false,
            retry: noop,
            items: [],
            selected: [],
            searchTargetMembers: noop
        },
        folders: { loading: false, failed: false, retry: noop, items: [], folderType: "" },
        references: { loading: false, failed: false, retry: noop, ...createEmptyRuleReferences() },
        ruleErrors: { items: [], clearRuleError: noop },
        ruleIssues: { items: [] },
        testRouting: {
            vm: {
                requesterId: null,
                folderId: null,
                canRun: false,
                hint: null,
                buttonLabel: "Test routing",
                status: "idle",
                stale: false,
                result: null,
                errorMessage: null
            },
            setTestRequester: noop,
            setTestFolder: noop,
            runTest: noop
        }
    };
};
```

In `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.ts`, the `formOptions` getter builds the five 9a slices by hand; until Task 16 (`assignment`, `users`, `targetMembers`, `folders`, `references`) and Task 22b (`ruleErrors`, `ruleIssues`, `testRouting`) fill the new ones, they default to the empty ones. The file already imports `createEmptyStepFormOptions` (9a), so no import changes. Before:

```ts
        return {
            teams: {
                loading: teamOptions.loading,
```

After:

```ts
        return {
            ...createEmptyStepFormOptions(),
            teams: {
                loading: teamOptions.loading,
```

Replace `packages/app-workflows/src/editor/testing/findFormFieldVm.ts` in full:

```ts
import type { FormModel } from "@webiny/app-admin";

type LayoutNodeVm = FormModel.FormVM["layout"][number];

// The fields of the layout nodes: the rows, also inside the tabs (a tab holds its own layout).
const collectFields = (nodes: LayoutNodeVm[]): FormModel.FieldVM[] => {
    const fields: FormModel.FieldVM[] = [];
    for (const node of nodes) {
        if (node.type === "row") {
            fields.push(...node.fields);
        }
        if (node.type === "tabs") {
            for (const tab of node.tabs) {
                const tabFields = collectFields(tab.layout);
                fields.push(...tabFields);
            }
        }
    }
    return fields;
};

/*
 * Finds a field VM by dotted path (`title`, `settings.url`, `assignment.rules`) in a form VM's
 * layout, through tabs and object fields, as a renderer would reach it; null when the field is not
 * in the layout.
 */
export const findFormFieldVm = (
    form: FormModel.FormVM | null,
    path: string
): FormModel.FieldVM | null => {
    if (form === null) {
        return null;
    }
    const [head, ...rest] = path.split(".");
    const top = collectFields(form.layout);

    let found = top.find(field => field.name === head);
    for (const part of rest) {
        if (!found || found.type !== "object") {
            return null;
        }
        const objectField: FormModel.ObjectFieldVM = found as FormModel.ObjectFieldVM;
        found = objectField.fields.find(field => field.name === part);
    }

    return found ?? null;
};
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/buildPeopleStepForm.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/createEmptyStepFormOptions.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/TeamsPickerRenderer.test.tsx 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawer.test.tsx 2>&1 | tail -30
```

Expected: all pass.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/stepDrawer 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx 2>&1 | tail -20
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors. The stepDrawer tests that open a People step still pass because they find fields through the updated `findFormFieldVm` and `getPeopleStepPatch` writes the default assignment for a default step. If a `StepDrawerPresenter` test asserts the exact `config` of a People patch and fails, the cause is Task 9's `assignmentToConfig` output differing from `{ strategy: "none", allowManualPick: false, rules: [] }`: fix Task 9, not this task.

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
git commit -m "feat(app-workflows): give the People step form its Assignment and Test routing tabs" -m "The People form becomes a FormModel form with layout tabs General, Assignment and Test routing. The assignment is a form object with the strategy, the requester-pick toggle and the routing rules (a plain JSON list in a permissions-typed field); the form data and the patch read and write it through the typed assignment, so every key the editor does not edit is written back as stored. The step form options gain the slices the new renderers read." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **A new `assignment` slice in `StepFormOptions` (`stepTeamIds`, `strategy`).** The contract lists the slices `users`, `targetMembers`, `folders`, `references`, `ruleErrors`, `ruleIssues`, `testRouting`. The rule list renderer needs the step's current reviewing team ids (the target pools, `createRule(teamIds, ...)`, the member lookup scope, R296, R307) and the strategy (the empty note, R297), both values of sibling form fields; a field renderer receives only its own `field`, and a layout element receives no form. Task 16 fills `assignment` from the drawer form's current `teams` and `assignment.strategy` values (the presenter's existing selected-team-ids helper, or the form VM's fields), not from the saved step (controller ruling: Task 16 owns the filling of `assignment`, `users`, `targetMembers`, `folders` and `references`; Task 18 only defines the defaults).
- **Slice shapes follow Task 22's assumptions:** `users` and `folders` extend `StepFormListState` (`retry` is what the pickers' `Try again` calls; Task 16 binds `users.retry` to the presenter's `retryUsers()`, `targetMembers.retry` to `retryTargetMembers(teamIds)` and `folders.retry` to the folder reload of Task 14b; verify the names against Task 14b) and `testRouting` is `{ vm: TestRoutingVm; setTestRequester; setTestFolder; runTest }`. The callbacks keep the contract's names (`searchUsers`, `searchTargetMembers(stepTeamIds, search)`, `setTestRequester`, `setTestFolder`, `runTest`, `clearRuleError`); `references.retry` is the contract's `retryReferences` (bound by Task 16 to `source.retryReferences`). `clearRuleError(ruleId: string)` takes only the rule id, like Task 16's `clearRuleError(ruleId: string): void` and Task 22b's binding: an edit of any field of a rule, or its removal, clears that rule's server error and nothing else (R303).
- **`StepFormRuleError` mirrors Task 16's `RuleErrorVm`** (`ruleId`, `field`, `message`) so the form code does not import from `stepDrawer`; Task 22b maps one to the other (identity). **`StepFormTestRoutingVm` mirrors Task 17's `TestRoutingVm`** (the contract's `testRouting` slice carries the `TestRoutingVm`): Task 18 must run before Tasks 16 and 17 (Task 16's tests need this form), so the form code cannot import Task 17's type; the two are structurally identical and assignable both ways (Task 22 and Task 22b keep using `TestRoutingVm`). If Task 17 changes the shape, change this interface with it. This task also needs nothing else of 9b.5, so the controller can run it right after 9b.4.
- **`AssignmentFormValues.strategy` is `AssignmentStrategy | null`**, because Task 9's `AssignmentValue.strategy` is `null` for an unknown stored strategy (the contract's Interfaces entry says `AssignmentStrategy`). R314 holds: no card is selected and the raw value is written back until the admin picks one.
- **Task 9's paths:** `readAssignment` and `assignmentToConfig` live in `model/assignment/` (the contract lists them in `model/`); this task imports them from there.
- **`buildPeopleStepForm(params?)`** takes an optional `{ readOnly }` (not in the contract) for the teams-off People step (R309, Task 16): no tabs and every field disabled. `StepDrawerPresenter.buildForm` (Task 16) passes `{ readOnly: true }` for such a step and still calls it with no argument otherwise.
- **`StepDrawerPresenter.formOptions` is a presenter getter today** (9a), not a view helper; this task adds only the spread of `createEmptyStepFormOptions()` there so the build stays green. Task 16 extends that getter for the source-backed slices and Task 22b (`buildStepFormOptions(vm, presenter)`) adds the drawer-VM slices; whichever way it goes, the slice shapes above are the interface.
- **`StepDrawer.test.tsx` and `TeamsPickerRenderer.test.tsx` change** because the form now has tabs and the hint is the full text; both are listed as modified files. Task 16 and Task 23 add their own cases to `StepDrawer.test.tsx` later.
- Size: large (form, data, patch, messages, options slices, helper, six test files).

## Review fixes (sub-phase review)

- The task text and the contract notes said Task 22b fills `assignment` and binds the retries; per the controller ruling Task 16 (9b.5) fills `assignment`, `users`, `targetMembers`, `folders` and `references` in `StepDrawerPresenter.formOptions` and Task 22b adds `ruleErrors`, `ruleIssues`, `testRouting`. Intro, file list, the presenter hunk text and three contract notes now say so (the presenter already imports `createEmptyStepFormOptions`, so the one-line hunk needs no import).
- `buildAssignmentField`: the three `.afterChange(validateAfterChange(...))` calls (a call as an argument) now use named constants.
- `findFormFieldVm`: `fields.push(...collectFields(...))` now goes through a named constant.
- Verified against the repo: `TabsNodeVM`, `TabDefinitionVM`, `ObjectFieldVM`, `focusField`, `layout.element`, the boolean field's default renderer `switch`, the 9a `StepDrawer.test.tsx` and `StepDrawerPresenter.test.ts` before-hunks, and that `Members of these teams can review.` appears only in the three files the task edits.
