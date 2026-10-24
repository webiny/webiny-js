### Task 21b: `RoutingRulesRenderer` list

R285, R293, R294, R295, R296, R299, R303, R313; D42, D46, D69; design README 4 and `research-spec.md` 4.2, 7; Review Focus 2, 3, 10. The Assignment tab's rule list: the header, the empty note, one `RuleCard` per rule, and the commands that edit the list: add, move, delete, and every edit of a card. The list is the form field `assignment.rules` (Task 18): its value is a plain-JSON `RuleValue[]`, written back through the Task 10 helpers, so ids stay stable and nothing the editor does not edit is lost.

- **Header and empty note (design 4.2):** the title `Routing rules`, the sub text `The first matching rule wins. If no rule matches, the strategy decides.`, and the tertiary small button `Add rule` (add icon). With no rules a dashed note reads `No rules. Reviews wait in the team pool.` when the strategy is `none`, else `No rules. The strategy picks the reviewer.` (an unknown strategy, `null`, is the second). The strategy comes from the options' `assignment` slice (the drawer hands over the form's current value, Task 18).
- **Add (R296):** a new rule has no conditions and the target `{ type: "team", id: <first reviewing team> }`, or no target when the step has no teams (`options.assignment.stepTeamIds`); `createRule(stepTeamIds, existingIds)` (Task 10) makes it, `addRule` appends it, and its id is created now, never on load (R294). A rule with no target is a client error (R299) that the card shows as soon as the issues recompute.
- **Move, delete, edit (R294, R295, R303):** `moveRule`, `removeRule`, `updateRule` and `clearFolderCondition` (Task 10) return new arrays and keep every rule's `id` and `preserved`; each command writes the new list with `field.onChange` and blurs the field. Delete and every card edit call `options.ruleErrors.clearRuleError(ruleId)` first (R303: editing a rule or removing it clears that rule's server error and nothing else; Task 16's presenter also clears on the value change, the explicit call is the contract's safety net).
- **Keyboard reorder (R313):** after a move, keyboard focus stays on the moved card's same button, or on the other arrow when that one became disabled (the card is now first or last), and a polite live region (`role="status"`) says `Rule moved to position {position} of {total}.` (Q59.4). The list remembers the move request in a ref and acts after the render that applied the new order (the pattern of the step list, 9a Task 16).
- **Plain data only:** the form value holds no React node, function or class instance; the list copies the field value with `toJS` before it hands rules to the helpers, so MobX proxies never reach a helper or the form again.
- **Read-only (R309):** the field is disabled: `Add rule` is disabled, every card is read-only, nothing is written.
- **Per-rule messages:** each card gets only its own issues (`options.ruleIssues`) and server errors (`options.ruleErrors`), filtered by `ruleId`.

**Files:** (`[STEP]` = `packages/app-workflows/src/editor/presentation`, `[RULES]` = `[STEP]/stepForm/renderers/routingRules`)
- Create: `[RULES]/readRules.ts`
- Create: `[RULES]/RuleMoveRequest.ts`
- Create: `[RULES]/RulesEmptyNote.tsx`
- Create: `[RULES]/RoutingRulesList.tsx`
- Create: `[STEP]/stepForm/renderers/RoutingRulesRenderer.tsx`
- Create: `[RULES]/readRules.test.ts`
- Create: `[RULES]/RulesEmptyNote.test.tsx`
- Create: `[STEP]/stepForm/renderers/RoutingRulesRenderer.test.tsx`
- Modify: `packages/app-workflows/src/editor/WorkflowEditorConfig.tsx`, `WorkflowEditorConfig.test.tsx`

**Interfaces:**
- Consumes (verified in the repo today): admin-ui `Button`, `Text`; `@webiny/icons` `add`; `createFieldRenderer`; `useStepFormOptions`; `buildPeopleStepForm`, `getPeopleFormData`; `renderStepFormField`, `createTestFormModelFactory`, `createStepFormOptions`, `createReviewStep`; mobx `toJS` and `observable`.
- Consumes (earlier tasks, as their task files specify; verify each): Task 9 (`RuleValue`, `createRuleValue`); Task 10 (`createRule(teamIds, existingIds)`, `addRule`, `moveRule(rules, from, to)`, `removeRule`, `updateRule(rules, ruleId, patch)`, `clearFolderCondition`, `RulePatch`); Task 11 (`RuleIssue`, `createReferenceLabel`); Task 18 (`StepFormOptions` with `assignment`, `ruleErrors`, `ruleIssues` and the card slices, `ASSIGNMENT_FORM_MESSAGES`, `STEP_FORM_RENDERER.routingRules`, the `workflowRoutingRules` augmentation, the form field `assignment.rules`); Task 19b (`workflowPickerStub.tsx`, `stepFormOptionsFixtures.ts`, `createWorkflowUserSummary`); Task 21 (`RuleCard`, `RuleCardProps`).
- Produces: renderer `workflowRoutingRules` (`RoutingRulesRenderer`), `RoutingRulesList`, `RulesEmptyNote`, `readRules`, `RuleMoveRequest`.

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`. Type check: `yarn check:test:types -p app-workflows --report cli` and `yarn build -p @webiny/app-workflows --no-cache`.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/readRules.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { isObservable } from "mobx";
import { observable } from "mobx";
import { createRuleValue } from "~/editor/testing/ruleFixtures.js";
import { readRules } from "./readRules.js";

describe("readRules (R293)", () => {
    it("returns the rules of a plain array", () => {
        const rules = [createRuleValue({ id: "r1" }), createRuleValue({ id: "r2" })];

        expect(readRules(rules)).toEqual(rules);
    });

    it("turns an observable list of observable rules into plain data", () => {
        const rules = observable([createRuleValue({ id: "r1", preserved: { conditions: { a: 1 } } })]);

        const plain = readRules(rules);

        expect(plain).toEqual([createRuleValue({ id: "r1", preserved: { conditions: { a: 1 } } })]);
        expect(isObservable(plain)).toBe(false);
        expect(isObservable(plain[0])).toBe(false);
        expect(isObservable(plain[0].preserved)).toBe(false);
    });

    it("is an empty list for anything that is not a list", () => {
        expect(readRules(null)).toEqual([]);
        expect(readRules(undefined)).toEqual([]);
        expect(readRules("r1")).toEqual([]);
        expect(readRules({ id: "r1" })).toEqual([]);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/RulesEmptyNote.test.tsx`:

```tsx
import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { cleanup } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { RulesEmptyNote } from "./RulesEmptyNote.js";

describe("RulesEmptyNote (design 4.2)", () => {
    afterEach(() => {
        cleanup();
    });

    it("says reviews wait in the team pool for the strategy none", () => {
        renderWithAdminUi(<RulesEmptyNote strategy={"none"} />);

        expect(screen.getByText("No rules. Reviews wait in the team pool.")).toBeDefined();
    });

    it("says the strategy picks the reviewer for any other strategy", () => {
        renderWithAdminUi(<RulesEmptyNote strategy={"roundRobin"} />);

        expect(screen.getByText("No rules. The strategy picks the reviewer.")).toBeDefined();

        cleanup();
        renderWithAdminUi(<RulesEmptyNote strategy={"leastLoaded"} />);

        expect(screen.getByText("No rules. The strategy picks the reviewer.")).toBeDefined();
    });

    it("treats an unknown strategy like a picking one", () => {
        renderWithAdminUi(<RulesEmptyNote strategy={null} />);

        expect(screen.getByText("No rules. The strategy picks the reviewer.")).toBeDefined();
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/RoutingRulesRenderer.test.tsx`:

```tsx
import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { within } from "@testing-library/react";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createAppFolder } from "~/editor/testing/editorFixtures.js";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import { createStepFormOptions } from "~/editor/testing/createStepFormOptions.js";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { renderStepFormField } from "~/editor/testing/renderStepFormField.js";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { createRuleValue } from "~/editor/testing/ruleFixtures.js";
import { createAssignmentSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createFoldersSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createReferencesSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createRuleErrorsSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createRuleIssuesSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createTargetMembersSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createUsersSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import type { StepFormOptions } from "../StepFormOptions.js";
import { buildPeopleStepForm } from "../buildPeopleStepForm.js";
import { getPeopleFormData } from "../getPeopleFormData.js";
import { createEmptyStepFormOptions } from "../createEmptyStepFormOptions.js";
import { RoutingRulesRenderer } from "./RoutingRulesRenderer.js";

vi.mock("~/components/picker/WorkflowPicker.js", async () => {
    const stub = await import("~/editor/testing/workflowPickerStub.js");
    return { WorkflowPicker: stub.WorkflowPickerStub };
});

const LEGAL = createPickerOption({ id: "team-1", label: "Legal", icon: "group" });
const MARKETING = createPickerOption({ id: "team-2", label: "Marketing", icon: "group" });
const IVAN = createWorkflowUserSummary({
    id: "user-1",
    displayName: "Ivan Horvat",
    teamIds: ["team-1"]
});
const ANA = createWorkflowUserSummary({
    id: "user-2",
    displayName: "Ana Kovač",
    teamIds: ["team-1", "team-2"]
});
const CAMPAIGNS = createAppFolder({ id: "folder-1", path: "/Campaigns" });

const createRules = (): RuleValue[] => {
    return [
        createRuleValue({ id: "rule-1", target: { type: "team", id: "team-1" } }),
        createRuleValue({ id: "rule-2", target: { type: "user", id: "user-1" } }),
        createRuleValue({ id: "rule-3", target: { type: "team", id: "team-2" } })
    ];
};

const createForm = (rules: RuleValue[], readOnly = false) => {
    const form = createTestFormModelFactory().create(buildPeopleStepForm({ readOnly }));
    const values = getPeopleFormData(createReviewStep());
    form.setData(
        {
            ...values,
            assignment: { strategy: "none", allowManualPick: false, rules }
        },
        { dirty: false }
    );
    return form;
};

const createOptions = (overrides: Partial<StepFormOptions> = {}): StepFormOptions => {
    return createStepFormOptions({
        assignment: createAssignmentSlice({ stepTeamIds: ["team-1", "team-2"], strategy: "none" }),
        teams: { ...createEmptyStepFormOptions().teams, options: [LEGAL, MARKETING] },
        users: createUsersSlice({ items: [IVAN, ANA] }),
        targetMembers: createTargetMembersSlice({ items: [IVAN, ANA] }),
        folders: createFoldersSlice({ items: [CAMPAIGNS], folderType: "cms:article" }),
        ...overrides
    });
};

const renderRules = (form: ReturnType<typeof createForm>, options = createOptions()) => {
    renderStepFormField({ form, name: "assignment.rules", Renderer: RoutingRulesRenderer, options });
};

const getStoredRules = (form: ReturnType<typeof createForm>): RuleValue[] => {
    return form.getData().assignment.rules;
};

const getCard = (ruleId: string): HTMLElement => {
    const card = document.querySelector<HTMLElement>(`[data-rule-id="${ruleId}"]`);
    if (card === null) {
        throw new Error(`No card for ${ruleId}.`);
    }
    return card;
};

const getCardOrder = (): string[] => {
    const cards = screen.getAllByRole("group", { name: /^Rule \d+$/ });
    return cards.map(card => card.getAttribute("data-rule-id") ?? "");
};

const press = (ruleId: string, name: string) => {
    fireEvent.click(within(getCard(ruleId)).getByRole("button", { name }));
};

describe("RoutingRulesRenderer: header and empty note (design 4.2)", () => {
    afterEach(() => {
        cleanup();
    });

    it("shows the title, the sub text and the Add rule button", () => {
        renderRules(createForm(createRules()));

        expect(screen.getByText("Routing rules")).toBeDefined();
        expect(
            screen.getByText("The first matching rule wins. If no rule matches, the strategy decides.")
        ).toBeDefined();
        expect(screen.getByRole("button", { name: "Add rule" })).toBeDefined();
    });

    it("shows the empty note for the strategy none and no card", () => {
        renderRules(createForm([]));

        expect(screen.getByText("No rules. Reviews wait in the team pool.")).toBeDefined();
        expect(screen.queryAllByRole("group", { name: /^Rule \d+$/ })).toHaveLength(0);
    });

    it("shows the other empty note for a picking strategy and for an unknown one", () => {
        const picking = createOptions({
            assignment: createAssignmentSlice({ stepTeamIds: ["team-1"], strategy: "roundRobin" })
        });
        renderRules(createForm([]), picking);

        expect(screen.getByText("No rules. The strategy picks the reviewer.")).toBeDefined();

        cleanup();
        const unknown = createOptions({
            assignment: createAssignmentSlice({ stepTeamIds: ["team-1"], strategy: null })
        });
        renderRules(createForm([]), unknown);

        expect(screen.getByText("No rules. The strategy picks the reviewer.")).toBeDefined();
    });

    it("hides the empty note once there is a rule", () => {
        renderRules(createForm(createRules()));

        expect(screen.queryByText(/^No rules\./)).toBeNull();
    });
});

describe("RoutingRulesRenderer: the cards", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders one numbered card per rule, in the stored order", () => {
        renderRules(createForm(createRules()));

        expect(getCardOrder()).toEqual(["rule-1", "rule-2", "rule-3"]);
        expect(screen.getByText("Rule 3")).toBeDefined();
    });

    it("disables Move rule up on the first card and Move rule down on the last", () => {
        renderRules(createForm(createRules()));

        const firstUp: HTMLButtonElement = within(getCard("rule-1")).getByRole("button", {
            name: "Move rule up"
        });
        const lastDown: HTMLButtonElement = within(getCard("rule-3")).getByRole("button", {
            name: "Move rule down"
        });
        const middleUp: HTMLButtonElement = within(getCard("rule-2")).getByRole("button", {
            name: "Move rule up"
        });
        expect(firstUp.disabled).toBe(true);
        expect(lastDown.disabled).toBe(true);
        expect(middleUp.disabled).toBe(false);
    });

    it("hands each card only its own issues and server errors", () => {
        const issues: RuleIssue[] = [
            {
                ruleId: "rule-2",
                index: 1,
                kind: "warning",
                field: "folder",
                message: "The folder no longer exists."
            }
        ];
        const options = createOptions({
            ruleIssues: createRuleIssuesSlice({ items: issues }),
            ruleErrors: createRuleErrorsSlice({
                items: [{ ruleId: "rule-3", field: "target", message: "Server says no." }]
            })
        });
        renderRules(createForm(createRules()), options);

        expect(within(getCard("rule-2")).getByText("The folder no longer exists.")).toBeDefined();
        expect(within(getCard("rule-1")).queryByText("The folder no longer exists.")).toBeNull();
        expect(
            within(getCard("rule-3"))
                .getByTestId("picker-Then assign to")
                .getAttribute("data-error")
        ).toBe("Server says no.");
        expect(
            within(getCard("rule-1"))
                .getByTestId("picker-Then assign to")
                .getAttribute("data-error")
        ).toBe("");
    });
});

describe("RoutingRulesRenderer: add (R294, R296)", () => {
    afterEach(() => {
        cleanup();
    });

    it("appends a rule with no conditions that targets the pool of the first reviewing team", () => {
        const form = createForm(createRules());
        renderRules(form);

        fireEvent.click(screen.getByRole("button", { name: "Add rule" }));

        const stored = getStoredRules(form);
        expect(stored).toHaveLength(4);
        expect(stored.slice(0, 3)).toEqual(createRules());
        expect(stored[3]).toEqual({
            id: stored[3].id,
            requesterUserId: null,
            requesterTeamId: null,
            folder: null,
            target: { type: "team", id: "team-1" },
            preserved: {}
        });
        expect(stored[3].id).toMatch(/^r[a-z0-9]{12}$/);
        expect(createRules().map(rule => rule.id)).not.toContain(stored[3].id);
        expect(form.isDirty).toBe(true);
        expect(screen.getByText("Rule 4")).toBeDefined();
    });

    it("targets the first team in the order the form holds the teams", () => {
        const form = createForm([]);
        const options = createOptions({
            assignment: createAssignmentSlice({ stepTeamIds: ["team-2", "team-1"], strategy: "none" })
        });
        renderRules(form, options);

        fireEvent.click(screen.getByRole("button", { name: "Add rule" }));

        expect(getStoredRules(form)[0].target).toEqual({ type: "team", id: "team-2" });
    });

    it("adds a rule with no target when the step has no teams", () => {
        const form = createForm([]);
        const options = createOptions({
            assignment: createAssignmentSlice({ stepTeamIds: [], strategy: "none" })
        });
        renderRules(form, options);

        fireEvent.click(screen.getByRole("button", { name: "Add rule" }));

        expect(getStoredRules(form)[0].target).toBeNull();
    });

    it("gives each added rule an id of its own", () => {
        const form = createForm([]);
        renderRules(form);

        fireEvent.click(screen.getByRole("button", { name: "Add rule" }));
        fireEvent.click(screen.getByRole("button", { name: "Add rule" }));

        const ids = getStoredRules(form).map(rule => rule.id);
        expect(new Set(ids).size).toBe(2);
    });
});

describe("RoutingRulesRenderer: move (R294, R313, Q59.4)", () => {
    afterEach(() => {
        cleanup();
    });

    it("moves a rule down and keeps every rule as it was, with the same ids", () => {
        const form = createForm(createRules());
        renderRules(form);

        press("rule-1", "Move rule down");

        const stored = getStoredRules(form);
        const rules = createRules();
        expect(stored).toEqual([rules[1], rules[0], rules[2]]);
        expect(getCardOrder()).toEqual(["rule-2", "rule-1", "rule-3"]);
        expect(screen.getByText("Rule 1")).toBeDefined();
    });

    it("moves a rule up", () => {
        const form = createForm(createRules());
        renderRules(form);

        press("rule-3", "Move rule up");

        expect(getStoredRules(form).map(rule => rule.id)).toEqual(["rule-1", "rule-3", "rule-2"]);
    });

    it("keeps focus on the moved card's same button when it can move on", () => {
        renderRules(createForm(createRules()));

        press("rule-1", "Move rule down");

        const expected = within(getCard("rule-1")).getByRole("button", { name: "Move rule down" });
        expect(document.activeElement).toBe(expected);
    });

    it("moves focus to Move rule up when the rule reached the last position", () => {
        renderRules(createForm(createRules()));

        press("rule-2", "Move rule down");

        const expected = within(getCard("rule-2")).getByRole("button", { name: "Move rule up" });
        expect(document.activeElement).toBe(expected);
    });

    it("moves focus to Move rule down when the rule reached the first position", () => {
        renderRules(createForm(createRules()));

        press("rule-2", "Move rule up");

        const expected = within(getCard("rule-2")).getByRole("button", { name: "Move rule down" });
        expect(document.activeElement).toBe(expected);
    });

    it("announces the new position in a polite live region", () => {
        renderRules(createForm(createRules()));

        const region = screen.getByRole("status");
        expect(region.getAttribute("aria-live")).toBe("polite");
        expect(region.textContent).toBe("");

        press("rule-1", "Move rule down");

        expect(screen.getByRole("status").textContent).toBe("Rule moved to position 2 of 3.");

        press("rule-1", "Move rule down");

        expect(screen.getByRole("status").textContent).toBe("Rule moved to position 3 of 3.");
    });
});

describe("RoutingRulesRenderer: delete and edit (R294, R295, R303)", () => {
    afterEach(() => {
        cleanup();
    });

    it("deletes a rule, renumbers the cards and clears the rule's server error", () => {
        const clearRuleError = vi.fn();
        const form = createForm(createRules());
        renderRules(form, createOptions({ ruleErrors: createRuleErrorsSlice({ clearRuleError }) }));

        press("rule-2", "Delete rule");

        expect(getStoredRules(form).map(rule => rule.id)).toEqual(["rule-1", "rule-3"]);
        expect(getCardOrder()).toEqual(["rule-1", "rule-3"]);
        expect(screen.queryByText("Rule 3")).toBeNull();
        expect(clearRuleError).toHaveBeenCalledWith("rule-2");
    });

    it("writes the edit of one field into that rule only and clears its server error", () => {
        const clearRuleError = vi.fn();
        const form = createForm(createRules());
        renderRules(form, createOptions({ ruleErrors: createRuleErrorsSlice({ clearRuleError }) }));

        fireEvent.click(
            within(getCard("rule-1")).getByRole("button", { name: "Then assign to: choose Ana Kovač" })
        );

        const rules = createRules();
        expect(getStoredRules(form)).toEqual([
            { ...rules[0], target: { type: "user", id: "user-2" } },
            rules[1],
            rules[2]
        ]);
        expect(clearRuleError).toHaveBeenCalledWith("rule-1");
        expect(clearRuleError).toHaveBeenCalledTimes(1);
        expect(form.isDirty).toBe(true);
    });

    it("keeps what the editor does not edit when a field changes", () => {
        const preserved = { conditions: { modelId: "article" }, note: "kept" };
        const rules = [createRuleValue({ id: "rule-1", preserved })];
        const form = createForm(rules);
        renderRules(form);

        fireEvent.click(
            within(getCard("rule-1")).getByRole("button", {
                name: "Requester is: choose Ivan Horvat"
            })
        );

        expect(getStoredRules(form)[0]).toEqual({
            ...rules[0],
            requesterUserId: "user-1",
            preserved
        });
    });

    it("writes a picked folder with the app's folder type", () => {
        const form = createForm([createRuleValue({ id: "rule-1" })]);
        renderRules(form);

        fireEvent.click(
            within(getCard("rule-1")).getByRole("button", {
                name: "Content is in folder: choose /Campaigns"
            })
        );

        expect(getStoredRules(form)[0].folder).toEqual({
            id: "folder-1",
            type: "cms:article",
            includeDescendants: false
        });
    });

    it("removes a restricted folder condition and keeps the rest of the rule", () => {
        const clearRuleError = vi.fn();
        const rule = createRuleValue({
            id: "rule-1",
            requesterTeamId: "team-2",
            folder: { id: "f9", type: "cms:article", includeDescendants: true }
        });
        const form = createForm([rule]);
        const options = createOptions({
            ruleErrors: createRuleErrorsSlice({ clearRuleError }),
            references: createReferencesSlice({
                folders: [
                    createReferenceLabel({ id: "f9", label: "Restricted folder", state: "restricted" })
                ]
            })
        });
        renderRules(form, options);

        press("rule-1", "Remove");

        expect(getStoredRules(form)[0]).toEqual({ ...rule, folder: null });
        expect(clearRuleError).toHaveBeenCalledWith("rule-1");
    });

    it("keeps the form value plain JSON after every kind of edit (no React node, function or proxy)", () => {
        const form = createForm(createRules());
        renderRules(form);

        press("rule-1", "Move rule down");
        press("rule-3", "Delete rule");
        fireEvent.click(screen.getByRole("button", { name: "Add rule" }));
        fireEvent.click(
            within(getCard("rule-2")).getByRole("button", { name: "Then assign to: choose Ana Kovač" })
        );

        const stored = getStoredRules(form);
        expect(JSON.parse(JSON.stringify(stored))).toEqual(stored);
    });
});

describe("RoutingRulesRenderer: read-only (R309)", () => {
    afterEach(() => {
        cleanup();
    });

    it("disables Add rule and the card buttons and writes nothing", () => {
        const form = createForm(createRules(), true);
        renderRules(form);

        const add: HTMLButtonElement = screen.getByRole("button", { name: "Add rule" });
        const remove: HTMLButtonElement = within(getCard("rule-2")).getByRole("button", {
            name: "Delete rule"
        });
        expect(add.disabled).toBe(true);
        expect(remove.disabled).toBe(true);

        fireEvent.click(add);
        fireEvent.click(remove);

        expect(getStoredRules(form)).toEqual(createRules());
        expect(form.isDirty).toBe(false);
    });

    it("disables the pickers of every card", () => {
        renderRules(createForm(createRules(), true));

        for (const ruleId of ["rule-1", "rule-2", "rule-3"]) {
            const picker = within(getCard(ruleId)).getByTestId("picker-Then assign to");
            expect(picker.getAttribute("data-disabled")).toBe("true");
        }
    });
});
```

In `packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx` (as Task 20 leaves it), before:

```tsx
    it("registers the colour, teams, transport, automation, AI model, AI tools, user, folder and strategy renderers", () => {
```

After:

```tsx
    it("registers the colour, teams, transport, automation, AI model, AI tools, user, folder, strategy and routing rules renderers", () => {
```

Before:

```tsx
            "workflowFolderPicker",
            "workflowAssignmentStrategy"
        ]);
```

After:

```tsx
            "workflowFolderPicker",
            "workflowAssignmentStrategy",
            "workflowRoutingRules"
        ]);
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/readRules.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/RulesEmptyNote.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/RoutingRulesRenderer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx 2>&1 | tail -30
```

Expected: the first three fail with `Failed to resolve import` (`./readRules.js`, `./RulesEmptyNote.js`, `./RoutingRulesRenderer.js`). `WorkflowEditorConfig.test.tsx` fails on the renderer list (`workflowRoutingRules` missing).

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/readRules.ts`:

```ts
import { toJS } from "mobx";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";

/*
 * The rule list of the form field as plain data (R293): the field holds an observable array of
 * observable rules, which becomes plain JSON before it reaches the list helpers; anything that is
 * not a list is an empty list.
 */
export const readRules = (value: unknown): RuleValue[] => {
    if (!Array.isArray(value)) {
        return [];
    }
    const rules: RuleValue[] = toJS(value);
    return rules;
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/RuleMoveRequest.ts`:

```ts
// A keyboard move the list is waiting to see applied, to announce it and keep the focus (R313).
export interface RuleMoveRequest {
    ruleId: string;
    direction: "up" | "down";
}
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/RulesEmptyNote.tsx`:

```tsx
import React from "react";
import { Text } from "@webiny/admin-ui";
import { ASSIGNMENT_FORM_MESSAGES } from "../../assignmentFormMessages.js";

export interface RulesEmptyNoteProps {
    // The strategy as the form holds it; null for one the editor does not know.
    strategy: string | null;
}

// The dashed note of a list with no rule (design 4.2): what happens to a review instead.
export const RulesEmptyNote = ({ strategy }: RulesEmptyNoteProps) => {
    let consequence: string = ASSIGNMENT_FORM_MESSAGES.emptyRulesStrategy;
    if (strategy === "none") {
        consequence = ASSIGNMENT_FORM_MESSAGES.emptyRulesPool;
    }
    const text = `${ASSIGNMENT_FORM_MESSAGES.emptyRulesLead}${consequence}`;

    return (
        <div className={"rounded-lg border-sm border-dashed border-neutral-muted p-md"}>
            <Text size={"sm"} className={"text-neutral-strong"}>
                {text}
            </Text>
        </div>
    );
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/RoutingRulesList.tsx`:

```tsx
import React from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import { Button } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { FormModel } from "@webiny/app-admin";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { addRule } from "~/editor/model/rules/addRule.js";
import { clearFolderCondition } from "~/editor/model/rules/clearFolderCondition.js";
import { createRule } from "~/editor/model/rules/createRule.js";
import { moveRule } from "~/editor/model/rules/moveRule.js";
import { removeRule } from "~/editor/model/rules/removeRule.js";
import type { RulePatch } from "~/editor/model/rules/RulePatch.js";
import { updateRule } from "~/editor/model/rules/updateRule.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import { ASSIGNMENT_FORM_MESSAGES } from "../../assignmentFormMessages.js";
import { useStepFormOptions } from "../../useStepFormOptions.js";
import { readRules } from "./readRules.js";
import type { RuleMoveRequest } from "./RuleMoveRequest.js";
import { RuleCard } from "./RuleCard.js";
import { RulesEmptyNote } from "./RulesEmptyNote.js";

const TITLE_ID = "assignment-rules-title";

export interface RoutingRulesListProps {
    field: FormModel.FieldVM;
}

/*
 * The routing rule list (design 4.2, R294, R296, R313): the header, the empty note and one card
 * per rule. The rules are the form field's value; every command writes a new list through the
 * Task 10 helpers, so ids stay stable and nothing the editor does not edit is lost. The only
 * state is the live region's text, a visual one, and a ref for the pending keyboard move.
 */
export const RoutingRulesList = ({ field }: RoutingRulesListProps) => {
    const options = useStepFormOptions();
    const rules = readRules(field.value);
    const readOnly = field.disabled;
    const rootRef = useRef<HTMLDivElement>(null);
    const moveRequestRef = useRef<RuleMoveRequest | null>(null);
    const [announcement, setAnnouncement] = useState("");
    const orderKey = rules.map(rule => rule.id).join("|");

    // After a keyboard move: announce the new position and keep focus on the moved card's button.
    useEffect(() => {
        const request = moveRequestRef.current;
        const root = rootRef.current;
        if (request === null || root === null) {
            return;
        }
        const index = rules.findIndex(rule => rule.id === request.ruleId);
        if (index === -1) {
            return;
        }
        moveRequestRef.current = null;
        const moved = ASSIGNMENT_FORM_MESSAGES.ruleMoved(index + 1, rules.length);
        setAnnouncement(moved);

        // The pressed arrow, or the other one when the rule reached the first or last position.
        let label: string = ASSIGNMENT_FORM_MESSAGES.moveRuleDown;
        if (request.direction === "up") {
            label = ASSIGNMENT_FORM_MESSAGES.moveRuleUp;
        }
        const reachedFirst = request.direction === "up" && index === 0;
        const reachedLast = request.direction === "down" && index === rules.length - 1;
        if (reachedFirst) {
            label = ASSIGNMENT_FORM_MESSAGES.moveRuleDown;
        }
        if (reachedLast) {
            label = ASSIGNMENT_FORM_MESSAGES.moveRuleUp;
        }

        const cards = root.querySelectorAll("[data-rule-id]");
        for (const card of Array.from(cards)) {
            if (card.getAttribute("data-rule-id") === request.ruleId) {
                const button = card.querySelector<HTMLElement>(`[aria-label="${label}"]`);
                button?.focus();
                return;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderKey]);

    const commit = (next: RuleValue[]) => {
        field.onChange(next);
        field.onBlur();
    };

    const handleAdd = () => {
        const existingIds = rules.map(rule => rule.id);
        const rule = createRule(options.assignment.stepTeamIds, existingIds);
        const next = addRule(rules, rule);
        commit(next);
    };

    const handleMove = (index: number, direction: "up" | "down") => {
        let to = index + 1;
        if (direction === "up") {
            to = index - 1;
        }
        moveRequestRef.current = { ruleId: rules[index].id, direction };
        const next = moveRule(rules, index, to);
        commit(next);
    };

    const handleDelete = (ruleId: string) => {
        options.ruleErrors.clearRuleError(ruleId);
        const next = removeRule(rules, ruleId);
        commit(next);
    };

    const handleChange = (ruleId: string, patch: RulePatch) => {
        options.ruleErrors.clearRuleError(ruleId);
        const next = updateRule(rules, ruleId, patch);
        commit(next);
    };

    const handleRemoveFolder = (ruleId: string) => {
        options.ruleErrors.clearRuleError(ruleId);
        const next = rules.map(rule => (rule.id === ruleId ? clearFolderCondition(rule) : rule));
        commit(next);
    };

    return (
        <div
            ref={rootRef}
            role={"group"}
            aria-labelledby={TITLE_ID}
            className={"flex w-full flex-col gap-md"}
        >
            <div role={"status"} aria-live={"polite"} className={"sr-only"}>
                {announcement}
            </div>
            <div className={"flex items-start justify-between gap-md"}>
                <div className={"flex flex-col"}>
                    <span id={TITLE_ID} className={"text-md font-semibold"}>
                        {ASSIGNMENT_FORM_MESSAGES.rulesLabel}
                    </span>
                    <Text as={"span"} size={"sm"} className={"text-neutral-strong"}>
                        {ASSIGNMENT_FORM_MESSAGES.rulesHint}
                    </Text>
                </div>
                <Button
                    variant={"tertiary"}
                    size={"sm"}
                    text={ASSIGNMENT_FORM_MESSAGES.addRule}
                    icon={<AddIcon />}
                    disabled={readOnly}
                    onClick={handleAdd}
                />
            </div>
            {rules.length === 0 && <RulesEmptyNote strategy={options.assignment.strategy} />}
            {rules.map((rule, index) => (
                <RuleCard
                    key={rule.id}
                    rule={rule}
                    index={index}
                    total={rules.length}
                    readOnly={readOnly}
                    options={options}
                    issues={options.ruleIssues.items.filter(issue => issue.ruleId === rule.id)}
                    errors={options.ruleErrors.items.filter(error => error.ruleId === rule.id)}
                    onChange={patch => handleChange(rule.id, patch)}
                    onRemoveFolder={() => handleRemoveFolder(rule.id)}
                    onMoveUp={() => handleMove(index, "up")}
                    onMoveDown={() => handleMove(index, "down")}
                    onDelete={() => handleDelete(rule.id)}
                />
            ))}
        </div>
    );
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/RoutingRulesRenderer.tsx`:

```tsx
import React from "react";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { RoutingRulesList } from "./routingRules/RoutingRulesList.js";
import "../stepFormRendererNames.js";

/*
 * Routing rules (R293): the renderer of the plain-JSON `assignment.rules` field. It owns no state;
 * `RoutingRulesList` draws the header, the cards and the commands over the options the drawer
 * provides (the step's teams and strategy, the pickers' lists, the rule issues and errors).
 */
export const RoutingRulesRenderer = createFieldRenderer<"workflowRoutingRules">(({ field }) => {
    return <RoutingRulesList field={field} />;
});
```

In `packages/app-workflows/src/editor/WorkflowEditorConfig.tsx`, add the import after the `AssignmentStrategyRenderer` import:

```tsx
import { RoutingRulesRenderer } from "~/editor/presentation/stepForm/renderers/RoutingRulesRenderer.js";
```

and the entry after the strategy entry. Before:

```tsx
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.assignmentStrategy}
                component={AssignmentStrategyRenderer}
            />
        </AdminConfig>
```

After:

```tsx
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.assignmentStrategy}
                component={AssignmentStrategyRenderer}
            />
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.routingRules}
                component={RoutingRulesRenderer}
            />
        </AdminConfig>
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/readRules.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/RulesEmptyNote.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/RoutingRulesRenderer.test.tsx 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx 2>&1 | tail -30
```

Expected: all pass.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/stepDrawer 2>&1 | tail -40
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors.

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
git commit -m "feat(app-workflows): add the routing rule list renderer to the Assignment tab" -m "The rule list renders the header, the empty note and one card per rule, and edits the plain-JSON assignment.rules field through the rule list helpers: add (a new rule targets the first reviewing team's pool), move up and down with a live region and kept focus, delete, and every edit of a card, which clears that rule's server error. Rule ids stay stable and nothing the editor does not edit is lost." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **The list lives in `RoutingRulesList`, a named component**, and `RoutingRulesRenderer` only wraps it: the renderer function passed to `createFieldRenderer` is not a component the hooks rule recognises, and the list needs `useRef`, `useEffect` and one `useState` (the live region text). The contract's file list names only `RoutingRulesRenderer.tsx` and `routingRules/RulesEmptyNote.tsx`; `RoutingRulesList.tsx`, `readRules.ts` and `RuleMoveRequest.ts` are extra.
- **`clearRuleError(ruleId)` takes only the rule id** (Task 16's and Task 22b's signature); Task 18's slice type is the same. The list calls it before every edit and delete of a rule; Task 16's presenter also clears a rule's error when the form value of that rule changes, so the call is redundant by design (R303 says editing clears; the contract says the renderer calls it).
- **The strategy for the empty note is `options.assignment.strategy`**, the slice Task 18 added (the renderer cannot read the sibling field); Task 16 fills it from the form's current value, not from the saved step.
- **`RuleCard` is rendered with the whole `StepFormOptions`** as its `options` (it needs the `assignment`, `teams`, `users`, `targetMembers`, `folders` and `references` slices, which `RuleCardOptions` picks).
- **Focus rule:** moving a rule to the first or last position disables the arrow that was pressed, so focus goes to the other arrow of the same card (R313); a move that keeps both arrows enabled keeps focus on the pressed one. The step list of 9a (`WorkflowFlow`) uses the same pattern.
- Size: medium (three small files, one list component, one renderer, three test files).

## Review fixes (sub-phase review)

- `RoutingRulesList`: `setAnnouncement(ASSIGNMENT_FORM_MESSAGES.ruleMoved(...))` (a call as an argument) now goes through a named constant.
- Contract note on the empty-note strategy: "Task 22b must fill it" now reads Task 16 (controller ruling: Task 16 fills `assignment`).
