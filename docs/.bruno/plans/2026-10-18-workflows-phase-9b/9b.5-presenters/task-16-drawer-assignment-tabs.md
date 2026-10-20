### Task 16: `StepDrawerPresenter` assignment, tabs, live issues, teams-off read-only

R293, R299, R302, R303, R304, R309, R312; D174, D176; Q50, Q51, Q53, Q58; Review Focus 3, 5 and 10; QBZ-11, QBZ-12. The drawer presenter owns everything the Assignment tab and the chrome need as render-ready values (R234); Tasks 18 to 23 render them.

- **Live issues (R299):** `vm.ruleIssues` is `getRuleIssues(rules, { stepTeamIds, references })` of the form's current values: the rules and the teams as edited (not yet applied to the draft), the references of Task 14 (`source.getReferences()`). It is a computed value, so it recomputes when the step's teams or the rules change, when a reference resolves late and after a target edit. A user whose teams are unknown is not flagged (Task 11). Errors block Save through the editor's own validation (Task 12); the drawer's Done never blocks on them (R304).
- **Server and Save errors (R303):** `applyStepErrors` splits the step's errors. A rule error (`config.assignment.rules…`) whose `ruleId` is a rule of the form goes to `vm.ruleErrors` (`{ ruleId, field, message }`, the field from `getRuleErrorField`, `target` for a card-level error) and marks the `assignment.rules` field with the message so the Assignment tab shows its error mark (R293, R302); a rule error whose rule is gone, and every error with no form field, shows at the top of the drawer. Other assignment fields (`config.assignment.strategy`, `config.assignment.allowManualPick`) mark their form fields. Editing a rule's field (its target, requester, team or folder), removing the rule, or `clearRuleError(ruleId)` clears that rule's error and nothing else; the summary mark stays while any rule error remains. A server error on a rule replaces the live error of the same rule and field in `vm.ruleIssues` and in `vm.warnings`: the message is never shown twice.
- **Tabs (R302):** the drawer drives the tabs with `form.focusField`. Applying the errors on open focuses the first marked field, so a step whose error is on the Assignment tab opens on it. `vm.errorTab` is `getStepErrorTab` of the errors still marked (fields first, then rules); `showErrorTab()` focuses a marked field of that tab (the `assignment.rules` field, or `title`, when none). `focusField("color")` of Done keeps working because the General tab holds `color` (Task 18).
- **Warnings block (R312):** `vm.warnings` is `StepWarningLine[]` (`{ text, severity, ruleId? }`, Task 12's type): the lines of `source.getStepWarnings(stepId)` without its rule lines (the ones that carry a `ruleId`; the source reads the draft, which lacks the edits until Done), then the live rule lines built from the form: for each rule in order, its server errors (severity `error`) and its live issues (severity of the issue), each as `Rule {n}: {message}` with the rule's `ruleId` (n from the rule's position in the form). A server error never doubles the live issue it replaced. Empty while the notice shows.
- **Teams off (R290, R309):** a People step of an unavailable `review` row is read-only (Task 14): `vm.notice` is `This step needs teams, which are not enabled. It can't be edited.`, the form has no tabs (the form builder receives `readOnly`, Task 18), there are no `ruleIssues` or `ruleErrors`, the drawer asks for no teams, users or members, and Done closes without writing. Automation and AI steps are unaffected.
- **Searches the pickers need:** opening a People step asks `source.searchUsers("")` once (the requester picker's first results) and `source.searchTargetMembers(teamIds, "")` for the step's teams, again whenever the team set changes (the rule target picker's options, R307). An Automation step whose definition has a `ui: "user"` setting asks `source.searchUsers("")` when its form is built (the mirror of the team hint, `hasUserSetting`, controller ruling); its saved user ids resolve through Task 14.
- **Options slices (controller ruling):** `StepDrawerPresenter.formOptions` fills `assignment` (`stepTeamIds` and `strategy` as the form holds them now), `users`, `targetMembers`, `folders` and `references` from the source accessors of Tasks 14 and 14b, over `createEmptyStepFormOptions()` (Task 18 defines the shapes and defaults; `ruleErrors`, `ruleIssues` and `testRouting` stay the defaults here, Task 22b fills them from the drawer VM). The retries are bound to `retryUsers()`, `retryTargetMembers(stepTeamIds)` and `retryReferences()` (which also reloads a failed folder list); `references.loading` and `references.failed` come from `getReferencesStatus()`.

**Files:**
- Create: `packages/app-workflows/src/editor/presentation/stepDrawer/dropOverriddenIssues.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/hasUserSetting.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/hasUserSetting.test.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepDrawer/getRuleLines.ts`
- Create: `packages/app-workflows/src/editor/testing/drawerPresenterKit.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.assignment.test.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.formOptions.test.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepDrawer/drawerRuleLinesPure.test.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.stepWarnings.test.ts`
- Modify: `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.ts`
- Modify: `packages/app-workflows/src/editor/presentation/stepDrawer/abstractions.ts`
- Modify: `packages/app-workflows/src/editor/presentation/stepDrawer/stepDrawerMessages.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/abstractions.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts`
- Modify: `packages/app-workflows/src/editor/testing/fakeStepDrawerSource.ts`

**Interfaces:**
- Consumes: Task 18's form pieces (**see the order note in Step 0**): `buildPeopleStepForm(params: { readOnly: boolean })` with layout tabs `General`, `Assignment`, `Test routing` only when not read-only, the form fields `assignment.strategy`, `assignment.allowManualPick` and `assignment.rules`, `getPeopleFormData` and `getPeopleStepPatch` reading and writing `assignment`, `PeopleFormValues.assignment: AssignmentFormValues { strategy; allowManualPick; rules: RuleValue[] }`; Task 11 (`getRuleIssues(rules: RuleValue[], context: RuleIssueContext): RuleIssue[]`, `RuleIssue { ruleId; index; kind; field; message }`, `RuleIssueContext { stepTeamIds; references }`); Task 12 (`getStepWarnings` returning `StepWarningLine[]`, `StepWarningLine` in `~/editor/model/StepWarningLine.js`, `TEAMS_OFF_STEP_MESSAGE` in `~/editor/model/teamsOffMessage.js`, `StepContext`); Task 11 (`createRuleReferences`, `createReferenceLabel` in `[AWET]/ruleFixtures.ts`); Task 14 (`isStepReadOnly` for teams off, `getReferences`, `getReferencesStatus`, `retryReferences`, `getUserSettingKeys`, `createRoutingStep`, `createStoredRule`, `createListedUser`); Task 14b (`searchUsers`, `retryUsers`, `getUserOptions`, `searchTargetMembers`, `retryTargetMembers`, `getTargetMemberOptions`, `getFolderOptions`, `getFolderType`, the fake's `users`/`members`/`folders`/`folderType`); Task 18 (`StepFormOptions` slices `StepFormAssignmentOptions`, `StepFormUsersOptions`, `StepFormTargetMembersOptions`, `StepFormFoldersOptions`, `StepFormReferencesOptions`, `createEmptyStepFormOptions`, `StepDrawerPresenter.formOptions` already spreading the defaults); Task 15 (`StepFieldError.ruleId`, `getFormFieldPath`, `getRuleErrorField`, `getStepErrorTab`); 9a (`StepDrawerPresenter`, `applyStepErrors`, `clearEditedMarks`, `rebuildKeepingEdits`, `markedFields`, `FakeStepDrawerSource`, `StepDrawerPresenterFeature`).
- Produces: the test kit `drawerPresenterKit.ts` (`createDrawerSetup`, `createTwoRulesStep`, `getActiveTab`, `setActiveTab`, `withTarget`, `editRules`, `editAssignment`, `editTeams`, `deletedUser`; Task 17 imports it), `StepDrawerVm.errorTab: "general" | "assignment" | null`, `StepDrawerVm.notice: string | null`, `StepDrawerVm.warnings: StepWarningLine[]`, `StepDrawerVm.ruleErrors: RuleErrorVm[]`, `StepDrawerVm.ruleIssues: RuleIssue[]`, `RuleErrorVm { ruleId: string; field: RuleIssue["field"]; message: string }`, `StepDrawerPresenter.showErrorTab(): void`, `StepDrawerPresenter.clearRuleError(ruleId: string): void`, `StepDrawerSource.getStepWarnings(stepId: string): StepWarningLine[]` (and `WorkflowEditorPresenter`, `FakeStepDrawerSource.warnings` / `setWarnings`), `STEP_DRAWER_MESSAGES.teamsOffNotice`, the source-backed `formOptions` slices, `hasUserSetting`.

**Test runner note:** admin package, `yarn test <path>` only. Type check: `yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30`.

- [ ] **Step 0: Preconditions (order)**

This task's tests drive the real People form with the `assignment` field and the layout tabs, which Task 18 builds (`buildPeopleStepForm`, `StepFormData`, `getPeopleFormData`, `getPeopleStepPatch`), and the execution order (00-shared.md "Task order") runs Task 18 right after Task 15 and before this task (the same holds for Task 17); if it has not run, stop and report. Check:

```bash
cd /Users/brunozoric/work/webiny/webiny-js
grep -n "assignment\|layout\|tabs\|readOnly" packages/app-workflows/src/editor/presentation/stepForm/buildPeopleStepForm.ts
grep -n "assignment" packages/app-workflows/src/editor/presentation/stepForm/StepFormData.ts packages/app-workflows/src/editor/presentation/stepForm/getPeopleFormData.ts packages/app-workflows/src/editor/presentation/stepForm/getPeopleStepPatch.ts
grep -n "export" packages/app-workflows/src/editor/model/rules/getRuleIssues.ts
```

The form must have `assignment.strategy`, `assignment.allowManualPick`, `assignment.rules` and tabs with the ids `general` and `assignment` (the tests read `activeTabId` and call `setActiveTab`). If Task 18 used other tab ids, use them in `getActiveTab` and `setActiveTab` below. Two more assumptions to verify against Tasks 11 and the admin FormModel: `RuleIssue.index` is the 0-based position of the rule (the live-issue expectations below use `index: 0`; use the other base if Task 11 chose it), and `FormVM.errors` lists the fields whose validation was set invalid (`form.field(path).setValidation({ isValid: false, … })`, as the tab error mark relies on it). Task 18 must also give `buildPeopleStepForm` the parameter `{ readOnly: boolean }` (no tabs, read-only fields when true); record it under "Contract notes" if it did not.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/presentation/stepDrawer/drawerRuleLinesPure.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";
import { dropOverriddenIssues } from "./dropOverriddenIssues.js";
import { getRuleLines } from "./getRuleLines.js";
import type { RuleErrorVm } from "./abstractions.js";

const issue = (overrides: Partial<RuleIssue>): RuleIssue => {
    return {
        ruleId: "r-1",
        index: 0,
        kind: "error",
        field: "target",
        message: "The assigned user was deleted.",
        ...overrides
    };
};

const serverError = (overrides: Partial<RuleErrorVm>): RuleErrorVm => {
    return { ruleId: "r-1", field: "target", message: "Server says no.", ...overrides };
};

describe("dropOverriddenIssues (R303)", () => {
    it("drops the live error of the rule and field a server error names, and keeps the rest", () => {
        const issues = [
            issue({ ruleId: "r-1", field: "target", message: "Live error." }),
            issue({ ruleId: "r-1", field: "folder", kind: "warning", message: "Live warning." }),
            issue({ ruleId: "r-2", field: "target", message: "Other rule." })
        ];

        const kept = dropOverriddenIssues(issues, [serverError({ ruleId: "r-1", field: "target" })]);

        expect(kept.map(item => item.message)).toEqual(["Live warning.", "Other rule."]);
    });

    it("never drops a warning, even for the same rule and field", () => {
        const warning = issue({ kind: "warning", field: "folder", message: "Folder is gone." });

        const kept = dropOverriddenIssues([warning], [serverError({ field: "folder" })]);

        expect(kept).toEqual([warning]);
    });

    it("returns the issues as they are when there is no server error", () => {
        const issues = [issue({})];

        expect(dropOverriddenIssues(issues, [])).toEqual(issues);
    });
});

describe("getRuleLines (R312)", () => {
    it("prefixes every line with the rule's position, server errors before live issues, with severity and rule id", () => {
        const lines = getRuleLines({
            ruleIds: ["r-a", "r-b", "r-c"],
            issues: [
                issue({ ruleId: "r-c", message: "Third." }),
                issue({ ruleId: "r-b", kind: "warning", message: "Second warning." })
            ],
            errors: [serverError({ ruleId: "r-b", message: "Second error." })]
        });

        expect(lines).toEqual([
            { text: "Rule 2: Second error.", severity: "error", ruleId: "r-b" },
            { text: "Rule 2: Second warning.", severity: "warning", ruleId: "r-b" },
            { text: "Rule 3: Third.", severity: "error", ruleId: "r-c" }
        ]);
    });

    it("skips a rule that is not in the list and gives nothing for no rules", () => {
        expect(
            getRuleLines({
                ruleIds: ["r-a"],
                issues: [issue({ ruleId: "r-gone" })],
                errors: [serverError({ ruleId: "r-gone" })]
            })
        ).toEqual([]);
        expect(getRuleLines({ ruleIds: [], issues: [], errors: [] })).toEqual([]);
    });
});
```

Create `packages/app-workflows/src/editor/testing/drawerPresenterKit.ts` (a drawer presenter on the real FormModel over a `FakeStepDrawerSource`, and the helpers that edit its form; Task 17 imports it too):

```ts
import { Container } from "@webiny/di";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { IdentityContextFeature } from "@webiny/app-admin/features/security/IdentityContext/feature.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import type { StepDrawerPresenter } from "~/editor/presentation/stepDrawer/abstractions.js";
import { StepDrawerPresenterFeature } from "~/editor/presentation/stepDrawer/feature.js";
import type { AssignmentFormValues } from "~/editor/presentation/stepForm/StepFormData.js";
import { FakeStepDrawerSource } from "~/editor/testing/fakeStepDrawerSource.js";
import { createRuleReferences } from "~/editor/testing/ruleFixtures.js";
import { createRoutingStep } from "~/editor/testing/routingStepFixtures.js";
import { createStoredRule } from "~/editor/testing/routingStepFixtures.js";

export interface DrawerSetup {
    presenter: StepDrawerPresenter.Interface;
    source: FakeStepDrawerSource;
}

// The real drawer presenter over a fake source holding these steps; `configure` adjusts the source.
export const createDrawerSetup = (
    steps: EditorStep[],
    configure?: (source: FakeStepDrawerSource) => void
): DrawerSetup => {
    const container = new Container();
    IdentityContextFeature.register(container);
    FormModelFeature.register(container);
    StepDrawerPresenterFeature.register(container);
    const presenter = StepDrawerPresenterFeature.resolve(container).presenter;
    const source = new FakeStepDrawerSource(steps);
    if (configure) {
        configure(source);
    }
    return { presenter, source };
};

// A People step `step-1` with two rules that target the users `user-1` and `user-2`.
export const createTwoRulesStep = (): EditorStep => {
    return createRoutingStep([
        createStoredRule({ id: "r-1", target: { type: "user", id: "user-1" } }),
        createStoredRule({ id: "r-2", target: { type: "user", id: "user-2" } })
    ]);
};

// The id of the tab the form shows, null for a form without tabs.
export const getActiveTab = (presenter: StepDrawerPresenter.Interface): string | null => {
    const form = presenter.vm.form;
    if (form === null) {
        return null;
    }
    for (const node of form.layout) {
        if (node.type === "tabs") {
            return node.activeTabId;
        }
    }
    return null;
};

export const setActiveTab = (presenter: StepDrawerPresenter.Interface, id: string): void => {
    const form = presenter.vm.form;
    if (form === null) {
        return;
    }
    for (const node of form.layout) {
        if (node.type === "tabs") {
            node.setActiveTab(id);
        }
    }
};

export const withTarget = (rule: RuleValue, type: "user" | "team", id: string): RuleValue => {
    return { ...rule, target: { type, id } };
};

// Edits the rules of the open People form as an admin does.
export const editRules = (
    presenter: StepDrawerPresenter.Interface,
    update: (rules: RuleValue[]) => RuleValue[]
): void => {
    const form = presenter.vm.form;
    if (form === null) {
        throw new Error("The form is not open.");
    }
    const data = form.getData();
    const assignment = data.assignment as AssignmentFormValues;
    form.setData(
        { ...data, assignment: { ...assignment, rules: update(assignment.rules) } },
        { dirty: true }
    );
};

export const editAssignment = (
    presenter: StepDrawerPresenter.Interface,
    patch: Partial<AssignmentFormValues>
): void => {
    const form = presenter.vm.form;
    if (form === null) {
        throw new Error("The form is not open.");
    }
    const data = form.getData();
    const assignment = data.assignment as AssignmentFormValues;
    form.setData({ ...data, assignment: { ...assignment, ...patch } }, { dirty: true });
};

export const editTeams = (presenter: StepDrawerPresenter.Interface, teams: string[]): void => {
    const form = presenter.vm.form;
    if (form === null) {
        throw new Error("The form is not open.");
    }
    form.setData({ ...form.getData(), teams }, { dirty: true });
};

// References where this user is known to be gone (a deleted target, R298).
export const deletedUser = (id: string) => {
    return createRuleReferences({ users: [{ id, label: "Deleted user", state: "deleted" }] });
};
```

Create `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.assignment.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { EditorStep } from "~/editor/domain/types.js";
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
import { TEAMS_OFF_STEP_MESSAGE } from "~/editor/model/teamsOffMessage.js";
import { createDrawerSetup } from "~/editor/testing/drawerPresenterKit.js";
import { createTwoRulesStep } from "~/editor/testing/drawerPresenterKit.js";
import { deletedUser } from "~/editor/testing/drawerPresenterKit.js";
import { editRules } from "~/editor/testing/drawerPresenterKit.js";
import { editTeams } from "~/editor/testing/drawerPresenterKit.js";
import { getActiveTab } from "~/editor/testing/drawerPresenterKit.js";
import { setActiveTab } from "~/editor/testing/drawerPresenterKit.js";
import { withTarget } from "~/editor/testing/drawerPresenterKit.js";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import type { FakeStepDrawerSource } from "~/editor/testing/fakeStepDrawerSource.js";
import { createRuleReferences } from "~/editor/testing/ruleFixtures.js";
import { createRoutingStep } from "~/editor/testing/routingStepFixtures.js";
import { createStoredRule } from "~/editor/testing/routingStepFixtures.js";

const createSetup = (step: EditorStep, configure?: (source: FakeStepDrawerSource) => void) => {
    return createDrawerSetup([step], configure);
};

const twoRules = createTwoRulesStep;

const ruleError = (ruleId: string | null, field: string, message: string): StepFieldError => {
    return { field, message, ruleId };
};

describe("StepDrawerPresenter: live rule issues (R299, Review Focus 1)", () => {
    it("shows a live error and a warning line for a deleted user target on open", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.references = deletedUser("user-1");
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.ruleIssues).toEqual([
            {
                ruleId: "r-1",
                index: 0,
                kind: "error",
                field: "target",
                message: "The assigned user was deleted."
            }
        ]);
        expect(presenter.vm.warnings).toEqual([
            { text: "Rule 1: The assigned user was deleted.", severity: "error", ruleId: "r-1" }
        ]);
    });

    it("recomputes when a reference resolves after the drawer opened", () => {
        const { presenter, source } = createSetup(twoRules());
        presenter.open(source, "step-1");
        expect(presenter.vm.ruleIssues).toEqual([]);

        source.setReferences(deletedUser("user-2"));

        expect(presenter.vm.ruleIssues.map(issue => issue.ruleId)).toEqual(["r-2"]);
        expect(presenter.vm.warnings).toEqual([
            { text: "Rule 2: The assigned user was deleted.", severity: "error", ruleId: "r-2" }
        ]);
    });

    it("recomputes when the step's teams change", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.references = createRuleReferences({
                users: [{ id: "user-1", label: "Ada Lovelace", state: "found" }],
                userTeamIds: { "user-1": ["team-9"] }
            });
        });
        presenter.open(source, "step-1");
        expect(presenter.vm.ruleIssues.map(issue => issue.message)).toEqual([
            "Ada Lovelace is no longer in the reviewing teams."
        ]);

        editTeams(presenter, ["team-1", "team-9"]);

        expect(presenter.vm.ruleIssues).toEqual([]);
        expect(presenter.vm.warnings).toEqual([]);
    });

    it("recomputes after a target edit", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.references = deletedUser("user-1");
        });
        presenter.open(source, "step-1");
        expect(presenter.vm.ruleIssues).toHaveLength(1);

        editRules(presenter, rules => {
            return rules.map(rule => (rule.id === "r-1" ? withTarget(rule, "team", "team-1") : rule));
        });

        expect(presenter.vm.ruleIssues).toEqual([]);
    });

    it("shows a deleted folder as a warning, never as an error", () => {
        const step = createRoutingStep([
            createStoredRule({
                id: "r-1",
                folder: { id: "f-1", type: "cms:article", includeDescendants: false }
            })
        ]);
        const { presenter, source } = createSetup(step, configured => {
            configured.references = createRuleReferences({
                folders: [{ id: "f-1", label: "Deleted folder", state: "deleted" }]
            });
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.ruleIssues).toEqual([
            {
                ruleId: "r-1",
                index: 0,
                kind: "warning",
                field: "folder",
                message: "The folder no longer exists."
            }
        ]);
        expect(presenter.vm.warnings).toEqual([
            { text: "Rule 1: The folder no longer exists.", severity: "warning", ruleId: "r-1" }
        ]);
    });

    it("keeps the step's own warnings, drops its stale rule lines and adds the live ones", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.warnings = [
                { text: "Legal has no members.", severity: "warning" },
                { text: "Rule 1: A stale line.", severity: "warning", ruleId: "r-1" }
            ];
            configured.references = deletedUser("user-2");
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.warnings).toEqual([
            { text: "Legal has no members.", severity: "warning" },
            { text: "Rule 2: The assigned user was deleted.", severity: "error", ruleId: "r-2" }
        ]);
    });
});

describe("StepDrawerPresenter: rule errors of a save (R303, Review Focus 3)", () => {
    it("marks the rule the server names, opens on the Assignment tab and shows the tab's error", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.errors = [
                ruleError(
                    "r-2",
                    "config.assignment.rules.target",
                    "The target user is not a member of the step's teams."
                )
            ];
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.ruleErrors).toEqual([
            {
                ruleId: "r-2",
                field: "target",
                message: "The target user is not a member of the step's teams."
            }
        ]);
        expect(presenter.vm.errorTab).toBe("assignment");
        expect(getActiveTab(presenter)).toBe("assignment");
        expect(presenter.vm.topError).toBeNull();
    });

    it("names the rule field a schema failure belongs to", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.errors = [
                ruleError("r-1", "config.assignment.rules.conditions.folder.id", "Required.")
            ];
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.ruleErrors).toEqual([
            { ruleId: "r-1", field: "folder", message: "Required." }
        ]);
    });

    it("shows a card-level rule error on the target field of its rule", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.errors = [ruleError("r-1", "config.assignment.rules", "Invalid rule.")];
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.ruleErrors).toEqual([
            { ruleId: "r-1", field: "target", message: "Invalid rule." }
        ]);
    });

    it("shows an error at the top when its rule is gone or the server named none", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.errors = [
                ruleError("r-gone", "config.assignment.rules.target", "The rule was removed."),
                ruleError(null, "config.assignment.rules.target.id", "Required.")
            ];
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.ruleErrors).toEqual([]);
        expect(presenter.vm.topError).toBe("The rule was removed.");
    });

    it("marks the assignment form fields the server names", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.errors = [
                ruleError(null, "config.assignment.strategy", "Unknown strategy.")
            ];
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.errorTab).toBe("assignment");
        expect(presenter.vm.form?.errors.map(error => error.message)).toEqual([
            "Unknown strategy."
        ]);
    });

    it("clears only the error of the rule whose field was edited", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.errors = [
                ruleError("r-1", "config.assignment.rules.target", "First is wrong."),
                ruleError("r-2", "config.assignment.rules.target", "Second is wrong.")
            ];
        });
        presenter.open(source, "step-1");

        editRules(presenter, rules => {
            return rules.map(rule => (rule.id === "r-1" ? withTarget(rule, "team", "team-1") : rule));
        });

        expect(presenter.vm.ruleErrors).toEqual([
            { ruleId: "r-2", field: "target", message: "Second is wrong." }
        ]);
        expect(presenter.vm.errorTab).toBe("assignment");
    });

    it("clears the error of a rule that was removed, and the tab's error with the last one", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.errors = [
                ruleError("r-2", "config.assignment.rules.target", "Second is wrong.")
            ];
        });
        presenter.open(source, "step-1");
        expect(presenter.vm.errorTab).toBe("assignment");

        editRules(presenter, rules => rules.filter(rule => rule.id !== "r-2"));

        expect(presenter.vm.ruleErrors).toEqual([]);
        expect(presenter.vm.errorTab).toBeNull();
        expect(presenter.vm.form?.errors).toEqual([]);
    });

    it("keeps an error when another field of the same rule that it does not name is edited", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.errors = [
                ruleError("r-1", "config.assignment.rules.target", "First is wrong.")
            ];
        });
        presenter.open(source, "step-1");

        editRules(presenter, rules => {
            return rules.map(rule => (rule.id === "r-1" ? { ...rule, requesterUserId: "user-7" } : rule));
        });

        expect(presenter.vm.ruleErrors).toHaveLength(1);
    });

    it("clears a rule's errors on request", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.errors = [
                ruleError("r-1", "config.assignment.rules.target", "First is wrong."),
                ruleError("r-2", "config.assignment.rules.target", "Second is wrong.")
            ];
        });
        presenter.open(source, "step-1");

        presenter.clearRuleError("r-1");

        expect(presenter.vm.ruleErrors.map(error => error.ruleId)).toEqual(["r-2"]);
    });

    it("lets a server error replace the live message of the same rule and field, never doubling it", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.references = deletedUser("user-1");
            configured.errors = [
                ruleError("r-1", "config.assignment.rules.target", "Server says the user left.")
            ];
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.ruleErrors).toEqual([
            { ruleId: "r-1", field: "target", message: "Server says the user left." }
        ]);
        expect(presenter.vm.ruleIssues).toEqual([]);
        expect(presenter.vm.warnings).toEqual([
            { text: "Rule 1: Server says the user left.", severity: "error", ruleId: "r-1" }
        ]);
    });

    it("shows the live message again once the server error is cleared", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.references = deletedUser("user-1");
            configured.errors = [
                ruleError("r-1", "config.assignment.rules.target", "Server says the user left.")
            ];
        });
        presenter.open(source, "step-1");

        presenter.clearRuleError("r-1");

        expect(presenter.vm.ruleErrors).toEqual([]);
        expect(presenter.vm.ruleIssues.map(issue => issue.message)).toEqual([
            "The assigned user was deleted."
        ]);
    });
});

describe("StepDrawerPresenter: tabs (R302)", () => {
    it("shows the tab of an error that is not open and activates it on request", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.errors = [
                ruleError("r-1", "config.assignment.rules.target", "First is wrong.")
            ];
        });
        presenter.open(source, "step-1");
        setActiveTab(presenter, "general");
        expect(getActiveTab(presenter)).toBe("general");
        expect(presenter.vm.errorTab).toBe("assignment");

        presenter.showErrorTab();

        expect(getActiveTab(presenter)).toBe("assignment");
    });

    it("opens on the General tab for a General error and names it", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.errors = [{ field: "title", message: "Enter a title.", ruleId: null }];
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.errorTab).toBe("general");
        expect(getActiveTab(presenter)).toBe("general");
    });

    it("has no error tab for a step without errors", () => {
        const { presenter, source } = createSetup(twoRules());

        presenter.open(source, "step-1");

        expect(presenter.vm.errorTab).toBeNull();
    });

    it("still focuses the colour on the General tab when Done is blocked by a bad hex", async () => {
        const { presenter, source } = createSetup(twoRules());
        presenter.open(source, "step-1");
        setActiveTab(presenter, "assignment");
        const form = presenter.vm.form;
        form?.setData({ ...form.getData(), color: "#12" }, { dirty: true });

        await presenter.done();

        expect(source.closeStep).not.toHaveBeenCalled();
        expect(getActiveTab(presenter)).toBe("general");
    });
});

describe("StepDrawerPresenter: Done applies the assignment (R293)", () => {
    it("writes the edited rules through getPeopleStepPatch", async () => {
        const { presenter, source } = createSetup(twoRules());
        presenter.open(source, "step-1");

        editRules(presenter, rules => {
            return rules.map(rule => (rule.id === "r-1" ? withTarget(rule, "user", "user-5") : rule));
        });
        await presenter.done();

        expect(source.updateStep).toHaveBeenCalledTimes(1);
        const patch = source.updateStep.mock.calls[0][1];
        expect(patch.config).toMatchObject({
            teams: ["team-1"],
            assignment: {
                strategy: "none",
                allowManualPick: false,
                rules: [
                    { id: "r-1", target: { type: "user", id: "user-5" } },
                    { id: "r-2", target: { type: "user", id: "user-2" } }
                ]
            }
        });
        expect(source.closeStep).toHaveBeenCalledTimes(1);
    });

    it("does not block Done on a rule error (R304)", async () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.references = deletedUser("user-1");
        });
        presenter.open(source, "step-1");
        editRules(presenter, rules => rules.slice(0, 1));

        await presenter.done();

        expect(source.closeStep).toHaveBeenCalledTimes(1);
    });
});

describe("StepDrawerPresenter: searches of a People step", () => {
    it("asks for the first users and the members of the step's teams, again when the teams change", () => {
        const { presenter, source } = createSetup(twoRules());

        presenter.open(source, "step-1");

        expect(source.searchUsers).toHaveBeenCalledWith("");
        expect(source.searchTargetMembers).toHaveBeenCalledWith(["team-1"], "");

        editTeams(presenter, ["team-1", "team-2"]);

        expect(source.searchTargetMembers).toHaveBeenLastCalledWith(["team-1", "team-2"], "");
    });

    it("asks for neither users nor members for an Automation or AI step", () => {
        const automation = createSetup(createAutomationStep({ id: "step-1" }));
        const ai = createSetup(createAiStep({ id: "step-1" }));

        automation.presenter.open(automation.source, "step-1");
        ai.presenter.open(ai.source, "step-1");

        expect(automation.source.searchUsers).not.toHaveBeenCalled();
        expect(automation.source.searchTargetMembers).not.toHaveBeenCalled();
        expect(ai.source.searchUsers).not.toHaveBeenCalled();
        expect(ai.source.searchTargetMembers).not.toHaveBeenCalled();
    });
});

describe("StepDrawerPresenter: a People step while teams are off (R290, R309, Review Focus 5)", () => {
    const openReadOnly = () => {
        return createSetup(twoRules(), configured => {
            configured.readOnly = true;
            configured.references = deletedUser("user-1");
            configured.warnings = [{ text: TEAMS_OFF_STEP_MESSAGE, severity: "warning" }];
            configured.errors = [
                ruleError("r-1", "config.assignment.rules.target", "The rule is odd.")
            ];
        });
    };

    it("shows the notice, is read-only and has no tabs, rule issues or rule errors", () => {
        const { presenter, source } = openReadOnly();

        presenter.open(source, "step-1");

        expect(presenter.vm.readOnly).toBe(true);
        expect(presenter.vm.notice).toBe(TEAMS_OFF_STEP_MESSAGE);
        expect(presenter.vm.ruleIssues).toEqual([]);
        expect(presenter.vm.ruleErrors).toEqual([]);
        expect(presenter.vm.warnings).toEqual([]);
        expect(getActiveTab(presenter)).toBeNull();
    });

    it("asks for no teams, users or members", () => {
        const { presenter, source } = openReadOnly();

        presenter.open(source, "step-1");

        expect(source.searchTeams).not.toHaveBeenCalled();
        expect(source.searchUsers).not.toHaveBeenCalled();
        expect(source.searchTargetMembers).not.toHaveBeenCalled();
    });

    it("closes on Done without writing the step", async () => {
        const { presenter, source } = openReadOnly();
        presenter.open(source, "step-1");

        await presenter.done();

        expect(source.updateStep).not.toHaveBeenCalled();
        expect(source.closeStep).toHaveBeenCalledTimes(1);
    });
});

describe("StepDrawerPresenter: Automation and AI steps are unaffected (Review Focus 5)", () => {
    it("has no notice, tab error, rule issues or rule errors", () => {
        const automation = createSetup(createAutomationStep({ id: "step-1" }), configured => {
            configured.warnings = [{ text: "The automation “x” no longer exists.", severity: "warning" }];
        });
        const ai = createSetup(createAiStep({ id: "step-1" }));

        automation.presenter.open(automation.source, "step-1");
        ai.presenter.open(ai.source, "step-1");

        for (const { presenter } of [automation, ai]) {
            expect(presenter.vm.notice).toBeNull();
            expect(presenter.vm.errorTab).toBeNull();
            expect(presenter.vm.ruleIssues).toEqual([]);
            expect(presenter.vm.ruleErrors).toEqual([]);
        }
        expect(automation.presenter.vm.warnings).toEqual([
            { text: "The automation “x” no longer exists.", severity: "warning" }
        ]);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.formOptions.test.ts` (the source-backed slices of `formOptions` and the Automation `user` hint):

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createEditorOptions } from "~/editor/testing/createEditorOptions.js";
import { createDrawerSetup } from "~/editor/testing/drawerPresenterKit.js";
import { createTwoRulesStep } from "~/editor/testing/drawerPresenterKit.js";
import { editAssignment } from "~/editor/testing/drawerPresenterKit.js";
import { editTeams } from "~/editor/testing/drawerPresenterKit.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createAutomationDefinition } from "~/editor/testing/editorFixtures.js";
import { createRuleReferences } from "~/editor/testing/ruleFixtures.js";
import { createListedUser } from "~/editor/testing/routingStepFixtures.js";

const ADA = createListedUser("user-1", "Ada Lovelace", ["team-1"]);

describe("StepDrawerPresenter: the source-backed form options (controller ruling)", () => {
    it("hands over the step's teams and strategy as the form holds them now", () => {
        const { presenter, source } = createDrawerSetup([createTwoRulesStep()]);
        presenter.open(source, "step-1");

        expect(presenter.formOptions.assignment).toEqual({ stepTeamIds: ["team-1"], strategy: "none" });

        editTeams(presenter, ["team-1", "team-2"]);
        editAssignment(presenter, { strategy: "roundRobin" });

        expect(presenter.formOptions.assignment).toEqual({
            stepTeamIds: ["team-1", "team-2"],
            strategy: "roundRobin"
        });
    });

    it("fills the user and member slices from the source and binds their callbacks", () => {
        const { presenter, source } = createDrawerSetup([createTwoRulesStep()], configured => {
            configured.users = { items: [ADA], selected: [ADA], loading: true, failed: false };
            configured.members = { items: [ADA], selected: [], loading: false, failed: true };
        });
        presenter.open(source, "step-1");

        const { users, targetMembers } = presenter.formOptions;
        users.searchUsers("ad");
        users.retry();
        targetMembers.searchTargetMembers(["team-1"], "gra");
        targetMembers.retry();

        expect(users).toMatchObject({ items: [ADA], selected: [ADA], loading: true, failed: false });
        expect(targetMembers).toMatchObject({ items: [ADA], loading: false, failed: true });
        expect(source.searchUsers).toHaveBeenCalledWith("ad");
        expect(source.retryUsers).toHaveBeenCalledTimes(1);
        expect(source.searchTargetMembers).toHaveBeenCalledWith(["team-1"], "gra");
        expect(source.retryTargetMembers).toHaveBeenCalledWith(["team-1"]);
    });

    it("fills the folder slice with the list, the folder type and a retry that reloads", () => {
        const { presenter, source } = createDrawerSetup([createTwoRulesStep()], configured => {
            configured.folders = {
                items: [{ id: "f-1", path: "/News" }],
                loading: false,
                failed: true
            };
            configured.folderType = "cms:article";
        });
        presenter.open(source, "step-1");

        const { folders } = presenter.formOptions;
        folders.retry();

        expect(folders).toMatchObject({
            items: [{ id: "f-1", path: "/News" }],
            loading: false,
            failed: true,
            folderType: "cms:article"
        });
        expect(source.retryReferences).toHaveBeenCalledTimes(1);
    });

    it("fills the references slice with the maps, the status and the retry", () => {
        const { presenter, source } = createDrawerSetup([createTwoRulesStep()], configured => {
            configured.references = createRuleReferences({
                users: [{ id: "user-1", label: "Ada Lovelace", state: "found" }],
                userTeamIds: { "user-1": ["team-1"] }
            });
            configured.referencesStatus = { loading: true, failed: false };
        });
        presenter.open(source, "step-1");

        const { references } = presenter.formOptions;
        references.retry();

        expect(references.users.get("user-1")?.label).toBe("Ada Lovelace");
        expect(references.userTeamIds.get("user-1")).toEqual(["team-1"]);
        expect(references.loading).toBe(true);
        expect(references.failed).toBe(false);
        expect(source.retryReferences).toHaveBeenCalledTimes(1);
    });

    it("reacts to a reference that resolves while the drawer is open", () => {
        const { presenter, source } = createDrawerSetup([createTwoRulesStep()]);
        presenter.open(source, "step-1");
        expect(presenter.formOptions.references.users.size).toBe(0);

        source.setReferences(
            createRuleReferences({
                users: [{ id: "user-2", label: "Grace Hopper", state: "found" }]
            })
        );

        expect(presenter.formOptions.references.users.get("user-2")?.label).toBe("Grace Hopper");
    });

    it("keeps the defaults for the slices the drawer view fills later", () => {
        const { presenter, source } = createDrawerSetup([createTwoRulesStep()]);
        presenter.open(source, "step-1");

        const { ruleErrors, ruleIssues, testRouting } = presenter.formOptions;

        expect(ruleErrors.items).toEqual([]);
        expect(ruleIssues.items).toEqual([]);
        expect(testRouting.vm.status).toBe("idle");
    });
});

describe("StepDrawerPresenter: the Automation user hint", () => {
    const userAutomation = () => {
        return createAutomationDefinition({
            id: "notify-owner",
            name: "Notify owner",
            models: ["*"],
            settingsSchema: {
                type: "object",
                properties: { owner: { type: "string", title: "Owner", ui: "user" } }
            }
        });
    };

    it("asks for the first user results when the automation has a user setting", () => {
        const { presenter, source } = createDrawerSetup(
            [
                createAutomationStep({
                    id: "step-1",
                    config: { automationId: "notify-owner", settings: { owner: "user-1" } }
                })
            ],
            configured => {
                configured.options = createEditorOptions({
                    automations: { status: "ready", items: [userAutomation()] }
                });
            }
        );

        presenter.open(source, "step-1");

        expect(source.searchUsers).toHaveBeenCalledWith("");
    });

    it("asks for no users when the automation has no user setting", () => {
        const { presenter, source } = createDrawerSetup(
            [createAutomationStep({ id: "step-1" })],
            configured => {
                configured.options = createEditorOptions({
                    automations: {
                        status: "ready",
                        items: [createAutomationDefinition({ id: "send-webhook" })]
                    }
                });
            }
        );

        presenter.open(source, "step-1");

        expect(source.searchUsers).not.toHaveBeenCalled();
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.stepWarnings.test.ts`:

```ts
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
        setup.useCases.getWorkflow.mockResolvedValue(
            createEditorWorkflow({
                steps: [
                    createRoutingStep([
                        createStoredRule({ id: "r-1", target: { type: "user", id: "user-1" } })
                    ])
                ]
            })
        );
        setup.config.listTeams.mockResolvedValue({
            teams: [createWorkflowTeamSummary({ id: "team-1", name: "Editors", memberCount: 0 })],
            missingIds: []
        });
        setup.config.listUsers.mockResolvedValue({ users: [], missingIds: ["user-1"] });
        setup.app.listFolders.mockResolvedValue([]);
        setup.useCases.folderExists.mockResolvedValue(true);

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
        setup.config.listStepTypes.mockResolvedValue(
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
```

- [ ] **Step 2: Run the tests and expect failure**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/drawerRuleLinesPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.assignment.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.formOptions.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.stepWarnings.test.ts 2>&1 | tail -30
```

Expected: the first fails with `Failed to resolve import "./dropOverriddenIssues.js"`; the second with `expected undefined to equal []` on `presenter.vm.ruleIssues` (and the other new fields); the third with `formOptions.assignment` equal to the empty default (`stepTeamIds: []`) and `source.searchUsers` never called for the Automation hint; the fourth with `presenter.getStepWarnings is not a function`.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/stepDrawer/dropOverriddenIssues.ts`:

```ts
import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";
import type { RuleErrorVm } from "./abstractions.js";

/*
 * A server error on a rule replaces the live error of the same rule and field (R303), so the message
 * is shown once. Live warnings are never replaced. Pure.
 */
export const dropOverriddenIssues = (issues: RuleIssue[], errors: RuleErrorVm[]): RuleIssue[] => {
    if (errors.length === 0) {
        return issues;
    }
    return issues.filter(issue => {
        if (issue.kind !== "error") {
            return true;
        }
        return !errors.some(error => {
            return error.ruleId === issue.ruleId && error.field === issue.field;
        });
    });
};
```

Create `packages/app-workflows/src/editor/presentation/stepDrawer/getRuleLines.ts`:

```ts
import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";
import type { RuleErrorVm } from "./abstractions.js";

export interface RuleLinesParams {
    // The ids of the form's rules in order; the position gives the number of `Rule {n}: `.
    ruleIds: string[];
    // The live issues (already without the ones a server error replaced) and the server errors.
    issues: RuleIssue[];
    errors: RuleErrorVm[];
}

/*
 * The `Rule {n}: {message}` lines of the drawer's warnings block (R312): for each rule in order its
 * server errors (severity `error`), then its live issues (the issue's own severity). Every line
 * carries its rule's id. A rule that is not in the list gives no line. Pure.
 */
export const getRuleLines = (params: RuleLinesParams): StepWarningLine[] => {
    const lines: StepWarningLine[] = [];
    for (const [index, ruleId] of params.ruleIds.entries()) {
        const prefix = `Rule ${index + 1}: `;
        for (const error of params.errors) {
            if (error.ruleId === ruleId) {
                lines.push({ text: `${prefix}${error.message}`, severity: "error", ruleId });
            }
        }
        for (const issue of params.issues) {
            if (issue.ruleId === ruleId) {
                lines.push({ text: `${prefix}${issue.message}`, severity: issue.kind, ruleId });
            }
        }
    }
    return lines;
};
```

Modify `packages/app-workflows/src/editor/presentation/stepDrawer/stepDrawerMessages.ts`:

Add the import at the top and the key (Task 12's constant is the one text of the notice and of the step card line):

```ts
import { TEAMS_OFF_STEP_MESSAGE } from "~/editor/model/teamsOffMessage.js";
```

```ts
// Copy of the step drawer (design README 4, R269, R270, R309).
export const STEP_DRAWER_MESSAGES = {
    untitledStep: "Untitled step",
    footerText: "Edits stay in this workflow until you save it.",
    done: "Done",
    teamsOffNotice: TEAMS_OFF_STEP_MESSAGE
} as const;
```

Modify `packages/app-workflows/src/editor/presentation/stepDrawer/abstractions.ts`: add imports

```ts
import type { StepErrorTab } from "~/editor/model/getStepErrorTab.js";
import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";
import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
```

in `StepDrawerSource`, after `retryReferences(): void;`:

```ts
    // The step's warning lines as the card shows them, with its rule lines (they carry a `ruleId`, R312).
    getStepWarnings(stepId: string): StepWarningLine[];
```

after `StepDrawerAlertVm`:

```ts
// A server or Save error on one rule, ready for the rule card (R303).
export interface RuleErrorVm {
    ruleId: string;
    field: RuleIssue["field"];
    message: string;
}
```

in `IStepDrawerViewModel`, after `switchConfirmation`:

```ts
    // The tab that holds an error, or null (R302): the view shows the banner when it is not the open tab.
    errorTab: StepErrorTab | null;
    // `This step needs teams, which are not enabled. It can't be edited.` for a People step while teams are off.
    notice: string | null;
    // The `Check this step` lines: the step's warnings and the live `Rule {n}: ` lines (R312).
    warnings: StepWarningLine[];
    // Server and Save errors on rules, by rule (R303).
    ruleErrors: RuleErrorVm[];
    // The live issues of the rules in the form: errors and warnings (R299).
    ruleIssues: RuleIssue[];
```

in `IStepDrawerPresenter`, after `cancelSwitch(): void;`:

```ts
    // Activates the tab that holds an error (the banner's Show, R302).
    showErrorTab(): void;
    // Clears the server errors of one rule (the rule card calls it when its field is edited).
    clearRuleError(ruleId: string): void;
```

Modify `packages/app-workflows/src/editor/presentation/editor/abstractions.ts`: in `IWorkflowEditorPresenter`, after `getReferences(): RuleReferences;`:

```ts
    // The step's warning lines as the card shows them, with the rule lines (R312).
    getStepWarnings(stepId: string): StepWarningLine[];
```

with the import `import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";` next to the other model imports.

Modify `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts` (add the same import): after `getStepFieldErrors`:

```ts
    getStepWarnings(stepId: string): StepWarningLine[] {
        const step = this.getStep(stepId);
        if (step === null) {
            return [];
        }
        const context = this.getStepContext(step, isAiEditable(this.stepTypes.items));
        return getStepWarnings(step, context);
    }
```

Modify `packages/app-workflows/src/editor/testing/fakeStepDrawerSource.ts`: import `import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";`, member `warnings: StepWarningLine[] = [];` (after `references`), annotation `warnings: observableRef,` (after `references: observableRef,`) and methods

```ts
    getStepWarnings(): StepWarningLine[] {
        return this.warnings;
    }

    setWarnings(warnings: StepWarningLine[]): void {
        this.warnings = warnings;
    }
```

Modify `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.ts`.

Imports:

```ts
import { getStepErrorTab } from "~/editor/model/getStepErrorTab.js";
import type { StepErrorTab } from "~/editor/model/getStepErrorTab.js";
import { isRecord } from "~/editor/model/isRecord.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import { getRuleIssues } from "~/editor/model/rules/getRuleIssues.js";
import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";
import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
import { hasUserSetting } from "~/editor/presentation/stepForm/hasUserSetting.js";
import { dropOverriddenIssues } from "./dropOverriddenIssues.js";
import { getRuleErrorField } from "./getRuleErrorField.js";
import { getRuleLines } from "./getRuleLines.js";
import type { RuleErrorVm } from "./abstractions.js";
```

Replace the `MarkedField` interface and add the rule mark, the path constant and two pure helpers above the class:

```ts
// The form field that carries the rule list and the Assignment tab's error mark (R293, R302).
const RULES_PATH = "assignment.rules";

// A field marked with a step error, the value it had when it was marked and the error's server field.
interface MarkedField {
    path: string;
    message: string;
    value: string;
    field: string;
}

// A rule error: the rule, the field of the card it shows under, and that field's value when marked.
interface MarkedRule {
    ruleId: string;
    ruleField: RuleIssue["field"];
    message: string;
    value: string;
    field: string;
}

function getRuleFieldJson(rule: RuleValue, field: RuleIssue["field"]): string {
    if (field === "requesterUser") {
        return JSON.stringify(rule.requesterUserId);
    }
    if (field === "requesterTeam") {
        return JSON.stringify(rule.requesterTeamId);
    }
    if (field === "folder") {
        return JSON.stringify(rule.folder);
    }
    return JSON.stringify(rule.target);
}
```

Fields: add `private markedRules: MarkedRule[] = [];` after `markedFields`; in the `makeAutoObservable` generic list add `| "markedRules"` and in the options change `markedFields: false` to `markedFields: observableRef,` followed by `markedRules: observableRef`:

```ts
            stopWatching: false,
            markedFields: observableRef,
            markedRules: observableRef
```

(`markedFields` and `markedRules` are replaced, never mutated, so `vm.errorTab` and `vm.ruleErrors` react.)

`vm` getter — replace the body's tail. After `const readOnly = this.isReadOnly();` and the licence alert, compute and return:

```ts
        let notice: string | null = null;
        if (this.kind === "review" && readOnly) {
            notice = STEP_DRAWER_MESSAGES.teamsOffNotice;
        }
        const ruleErrors = this.getRuleErrors();
        const liveIssues = this.getLiveIssues();
        const ruleIssues = dropOverriddenIssues(liveIssues, ruleErrors);
```

and add to the returned object, after `switchConfirmation`:

```ts
            switchConfirmation,
            errorTab: this.getErrorTab(),
            notice,
            warnings: this.getWarnings(ruleIssues, ruleErrors, notice),
            ruleErrors,
            ruleIssues
```

`open` — replace

```ts
        if (this.kind === "review") {
            source.searchTeams("");
        }
```

with

```ts
        if (this.kind === "review" && !this.isReadOnly()) {
            source.searchTeams("");
            source.searchUsers("");
        }
```

(the member search runs from the watch reaction below, after the form exists).

New public methods, after `cancelSwitch()`:

```ts
    showErrorTab(): void {
        const form = this.form;
        const tab = this.getErrorTab();
        if (form === null || tab === null) {
            return;
        }
        const marked = this.markedFields.find(item => {
            return getStepErrorTab([{ field: item.field, message: "", ruleId: null }]) === tab;
        });
        if (marked !== undefined) {
            form.focusField(marked.path);
            return;
        }
        form.focusField(tab === "assignment" ? RULES_PATH : "title");
    }

    clearRuleError(ruleId: string): void {
        const remaining = this.markedRules.filter(marked => marked.ruleId !== ruleId);
        if (remaining.length === this.markedRules.length) {
            return;
        }
        this.markedRules = remaining;
        this.clearEditedMarks();
    }
```

`reset()` — add `this.markedRules = [];` after `this.markedFields = [];`.

`watch()` — add a member-search reaction. After `const stopMarked = reaction(...)` and before `const stopStep`:

```ts
        // The rule target picker lists the members of the step's teams (R307): ask when the drawer
        // opens and again whenever the team set changes.
        const stopMembers = reaction(
            () => this.getMemberSearchKey(),
            () => {
                if (this.kind === "review" && !this.isReadOnly()) {
                    const teamIds = this.getSelectedTeamIds();
                    source.searchTargetMembers(teamIds, "");
                }
            },
            { fireImmediately: true }
        );
```

and `this.stopWatching = [stopDirty, stopDefinitions, stopReadOnly, stopStep, stopMarked, stopMembers];`.

Replace `applyStepErrors`, `clearEditedMarks` and add the helpers (`readFieldJson` stays):

```ts
    private applyStepErrors(errors: StepFieldError[]): void {
        const form = this.form;
        let focused = false;
        const markedFields: MarkedField[] = [];
        const markedRules: MarkedRule[] = [];

        for (const error of errors) {
            const path = getFormFieldPath(error.field);
            if (path === null || form === null) {
                this.showTopError(error.message);
                continue;
            }
            let ruleMark: MarkedRule | null = null;
            if (path === RULES_PATH) {
                ruleMark = this.findRuleMark(error);
                // A rule error whose rule is gone shows at the top (R303).
                if (ruleMark === null) {
                    this.showTopError(error.message);
                    continue;
                }
            }
            try {
                form.field(path).setValidation({ isValid: false, message: error.message });
                const value = this.readFieldJson(path);
                markedFields.push({ path, message: error.message, value, field: error.field });
                if (ruleMark !== null) {
                    markedRules.push(ruleMark);
                }
                if (!focused) {
                    form.focusField(path);
                    focused = true;
                }
            } catch {
                this.showTopError(error.message);
            }
        }
        this.markedFields = markedFields;
        this.markedRules = markedRules;
    }

    // The rule an error names, as it is in the form now; null when it names none or the rule is gone.
    private findRuleMark(error: StepFieldError): MarkedRule | null {
        const ruleId = error.ruleId;
        if (ruleId === null) {
            return null;
        }
        const rule = this.getFormRules().find(item => item.id === ruleId);
        if (rule === undefined) {
            return null;
        }
        // A card-level error (the rule itself) shows on the target field and the card's border.
        const ruleField = getRuleErrorField(error.field) ?? "target";
        return {
            ruleId,
            ruleField,
            message: error.message,
            field: error.field,
            value: getRuleFieldJson(rule, ruleField)
        };
    }

    private clearEditedMarks(): void {
        const form = this.form;
        if (form === null) {
            return;
        }
        this.clearEditedRuleMarks();
        const remaining: MarkedField[] = [];
        for (const marked of this.markedFields) {
            if (this.isStillMarked(marked)) {
                remaining.push(marked);
                continue;
            }
            // A validation that already replaced the server message stays.
            const field = form.field(marked.path);
            if (field.vm.validation.message === marked.message) {
                field.resetValidation();
            }
        }
        if (remaining.length !== this.markedFields.length) {
            this.markedFields = remaining;
        }
    }

    // A rule error ends when its field was edited or its rule was removed (R303).
    private clearEditedRuleMarks(): void {
        if (this.markedRules.length === 0) {
            return;
        }
        const rules = this.getFormRules();
        const remaining: MarkedRule[] = [];
        for (const marked of this.markedRules) {
            const rule = rules.find(item => item.id === marked.ruleId);
            if (rule !== undefined && getRuleFieldJson(rule, marked.ruleField) === marked.value) {
                remaining.push(marked);
            }
        }
        if (remaining.length !== this.markedRules.length) {
            this.markedRules = remaining;
        }
    }

    // The summary mark of the rule list stays while any rule error remains.
    private isStillMarked(marked: MarkedField): boolean {
        if (marked.path === RULES_PATH) {
            return this.markedRules.length > 0;
        }
        return this.readFieldJson(marked.path) === marked.value;
    }

    private getRuleErrors(): RuleErrorVm[] {
        return this.markedRules.map(marked => {
            return { ruleId: marked.ruleId, field: marked.ruleField, message: marked.message };
        });
    }

    // The tab that holds an error still marked: the fields first, then the rules (R302).
    private getErrorTab(): StepErrorTab | null {
        const errors: StepFieldError[] = [];
        for (const marked of this.markedFields) {
            errors.push({ field: marked.field, message: marked.message, ruleId: null });
        }
        for (const marked of this.markedRules) {
            errors.push({ field: marked.field, message: marked.message, ruleId: marked.ruleId });
        }
        return getStepErrorTab(errors);
    }

    // Errors and warnings of the rules as the form has them now (R299); none for a read-only step.
    private getLiveIssues(): RuleIssue[] {
        const source = this.source;
        if (source === null || this.kind !== "review" || this.isReadOnly()) {
            return [];
        }
        const rules = this.getFormRules();
        const stepTeamIds = this.getSelectedTeamIds();
        const references = source.getReferences();
        return getRuleIssues(rules, { stepTeamIds, references });
    }

    // The source's lines minus its rule lines (they carry a `ruleId` and are rebuilt live), plus the live rule lines.
    private getWarnings(
        issues: RuleIssue[],
        errors: RuleErrorVm[],
        notice: string | null
    ): StepWarningLine[] {
        const source = this.source;
        if (source === null || this.step === null || notice !== null) {
            return [];
        }
        const sourceLines = source.getStepWarnings(this.stepId);
        const base = sourceLines.filter(line => line.ruleId === undefined);
        const ruleIds = this.getFormRules().map(rule => rule.id);
        const ruleLines = getRuleLines({ ruleIds, issues, errors });
        return [...base, ...ruleLines];
    }

    // The rules of the People form as edited; empty for any other form.
    private getFormRules(): RuleValue[] {
        if (this.form === null || this.kind !== "review") {
            return [];
        }
        const assignment = this.form.getData().assignment;
        if (!isRecord(assignment) || !Array.isArray(assignment.rules)) {
            return [];
        }
        const rules: RuleValue[] = assignment.rules;
        return rules;
    }

    private getMemberSearchKey(): string {
        return this.getSelectedTeamIds().join(",");
    }
```

`buildForm` — in the review branch replace `form = this.formModelFactory.create(buildPeopleStepForm());` with:

```ts
            form = this.formModelFactory.create(buildPeopleStepForm({ readOnly: this.isReadOnly() }));
```

(`getSelectedTeamIds` stays as it is and already reads `data.teams` of a review form.)

`formOptions` — fill the source-backed slices (controller ruling; Task 18 already spread `...createEmptyStepFormOptions()` first, so `ruleErrors`, `ruleIssues` and `testRouting` stay the defaults until Task 22b). After the `selectedTeams` line add:

```ts
        const stepTeamIds = this.getSelectedTeamIds();
        const userOptions = source.getUserOptions();
        const memberOptions = source.getTargetMemberOptions(stepTeamIds);
        const folderOptions = source.getFolderOptions();
        const references = source.getReferences();
        const referencesStatus = source.getReferencesStatus();
```

and after the `aiTools` slice (add a comma after its closing brace):

```ts
            assignment: { stepTeamIds, strategy: this.getStrategy() },
            users: {
                loading: userOptions.loading,
                failed: userOptions.failed,
                retry: () => source.retryUsers(),
                items: userOptions.items,
                selected: userOptions.selected,
                searchUsers: query => source.searchUsers(query)
            },
            targetMembers: {
                loading: memberOptions.loading,
                failed: memberOptions.failed,
                retry: () => source.retryTargetMembers(stepTeamIds),
                items: memberOptions.items,
                selected: memberOptions.selected,
                searchTargetMembers: (teamIds, search) => {
                    source.searchTargetMembers(teamIds, search);
                }
            },
            folders: {
                loading: folderOptions.loading,
                failed: folderOptions.failed,
                // `retryReferences` loads a failed folder list again and resolves what is left.
                retry: () => source.retryReferences(),
                items: folderOptions.items,
                folderType: source.getFolderType()
            },
            references: {
                ...references,
                loading: referencesStatus.loading,
                failed: referencesStatus.failed,
                retry: () => source.retryReferences()
            }
```

Add the helper next to `getSelectedTeamIds`:

```ts
    // The `assignment.strategy` value as the form holds it; null for another form or an unknown stored strategy (R314).
    private getStrategy(): string | null {
        if (this.form === null || this.kind !== "review") {
            return null;
        }
        const assignment = this.form.getData().assignment;
        if (!isRecord(assignment)) {
            return null;
        }
        const strategy = assignment.strategy;
        return typeof strategy === "string" ? strategy : null;
    }
```

Automation `user` hint — in `replaceAutomationForm`, after the block that asks for teams (`if (definition !== null && hasTeamSetting(definition.settingsSchema) && this.source !== null) { this.source.searchTeams(""); }`) add:

```ts
        if (
            definition !== null &&
            hasUserSetting(definition.settingsSchema) &&
            this.source !== null
        ) {
            this.source.searchUsers("");
        }
```

Create `packages/app-workflows/src/editor/presentation/stepForm/hasUserSetting.ts`:

```ts
import type { JsonSchema } from "@webiny/app-admin";
import { getUserSettingKeys } from "~/editor/model/getUserSettingKeys.js";

/*
 * True when a top-level setting of the schema carries the `user` ui hint: the drawer then asks for
 * the first user results, so the setting's picker has options (R285). The key list is
 * `getUserSettingKeys` (Task 14), which also tells which saved ids to resolve.
 */
export const hasUserSetting = (schema: JsonSchema | null): boolean => {
    return getUserSettingKeys(schema).length > 0;
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/hasUserSetting.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { JsonSchema } from "@webiny/app-admin/features/formModel/jsonSchema/JsonSchema.js";
import { hasUserSetting } from "./hasUserSetting.js";

describe("hasUserSetting (R285)", () => {
    it("is true when a top-level setting carries the user ui hint", () => {
        const schema: JsonSchema = {
            type: "object",
            properties: { owner: { type: "string", ui: "user" } }
        };

        expect(hasUserSetting(schema)).toBe(true);
    });

    it("is false for no schema and for settings without the hint", () => {
        const teamOnly: JsonSchema = {
            type: "object",
            properties: { owner: { type: "string", ui: "team" } }
        };

        expect(hasUserSetting(null)).toBe(false);
        expect(hasUserSetting(teamOnly)).toBe(false);
    });
});
```

- [ ] **Step 4: Run the tests and expect them to pass**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/drawerRuleLinesPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.assignment.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.formOptions.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/stepForm/hasUserSetting.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.stepWarnings.test.ts 2>&1 | tail -30
```

Expected: all pass.

- [ ] **Step 5: Run the existing tests covering the changed code, then the type check**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/stepDrawerPure.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.references.test.ts 2>&1 | tail -20
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: pass, no type errors. In the existing `StepDrawerPresenter.test.ts` the 9a People step cases that count `searchTeams` still pass (a People step that is not read-only asks as before); the cases that open a read-only step (an unknown type, an AI step without the AI editor) are unchanged. A 9a case that opens a People step now also sees `searchUsers` and `searchTargetMembers` calls on the fake and ignores them.

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
git add .
git restore --source=HEAD --staged --worktree .gitleaks.toml
git commit -m "feat(app-workflows): the step drawer presents rule issues, rule errors, tabs and teams-off state" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

**Contract notes:**
- **Order conflict:** the contract schedules Task 18 (People form, `getPeopleFormData`, `getPeopleStepPatch`, `buildPeopleStepForm` with the layout tabs) after 9b.5, but this task and Task 17 test the real People form with `assignment` and the tabs. The form part of Task 18 (not its renderers or its options slices) must land first, or Tasks 16 and 17 cannot go green. Task 18 must also give `buildPeopleStepForm` the parameter `{ readOnly: boolean }` (no tabs and read-only fields for a People step while teams are off, R309); the contract entry does not say so.
- `clearRuleError(ruleId: string): void` is added to the drawer presenter although the contract produces only `showErrorTab()`: Task 18 lists a `clearRuleError` callback in the rule slice and Task 21b calls it, so the presenter needs the method Task 22b binds. The automatic clearing on edit (R303) makes the explicit call a safety net.
- The `RuleErrorVm.field` of a card-level error (`id`, the rule as a whole, an unknown path) is `target`: the card's border and strip show it and the message sits under the target field.
- The drawer opens People steps with `searchUsers("")` and a member search that follows the team set: the contract does not name who triggers the first results of the rule pickers; Task 22b only binds the callbacks.
- `vm.warnings` is rebuilt from the form for the rule lines because the editor's `getStepWarnings(stepId)` reads the draft, which does not hold the edits until Done. Its rule lines (Task 12 marks them with a `ruleId`) are dropped and replaced by the live ones, which also carry the `ruleId` so Task 23 and Task 24 can match a server error to its line.
- The 9a ruling "Done mid-save keeps the 9a behaviour" is unchanged: `updateStep` of the editor presenter is a no-op while saving (covered by `WorkflowEditorPresenter.save.test.ts`); the drawer still calls it once on Done.

**Review fixes (sub-phase review):**
- `getStepWarnings` and `vm.warnings` now carry Task 12's `StepWarningLine[]` (severity and `ruleId`) instead of strings; the stale rule lines of the source are dropped by `ruleId` (not by a text prefix), the live ones carry their `ruleId`, `getRuleLines` returns lines, `FakeStepDrawerSource.warnings` / `setWarnings` take lines, and every warnings assertion and the stepWarnings test compare lines.
- `STEP_DRAWER_MESSAGES.teamsOffNotice` reuses Task 12's `TEAMS_OFF_STEP_MESSAGE`.
- `StepDrawerPresenter.formOptions` now fills `assignment`, `users`, `targetMembers`, `folders` and `references` from the source (controller ruling; it was missing), with a new test file `StepDrawerPresenter.formOptions.test.ts`. `references.loading` and `references.failed` come from the new `getReferencesStatus()` of Task 14; `folders.retry` is `retryReferences()`, which also reloads a failed folder list.
- The Automation `user` hint now asks `source.searchUsers("")` (controller ruling; `hasUserSetting` is created here, `getUserSettingKeys` in Task 14), with tests. Cross-sub-phase: Task 19b must not create `hasUserSetting.ts`, its test, `getUserSettingKeys.ts` or its test again.
- The kit imports `createRuleReferences` from Task 11's `ruleFixtures.ts`.
