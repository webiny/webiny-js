import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
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
    renderStepFormField({
        form,
        name: "assignment.rules",
        Renderer: RoutingRulesRenderer,
        options
    });
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
            screen.getByText(
                "The first matching rule wins. If no rule matches, the strategy decides."
            )
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
            assignment: createAssignmentSlice({
                stepTeamIds: ["team-2", "team-1"],
                strategy: "none"
            })
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

    it("announces the new position in a polite live region", async () => {
        renderRules(createForm(createRules()));

        const region = screen.getByRole("status");
        expect(region.getAttribute("aria-live")).toBe("polite");
        expect(region.textContent).toBe("");

        press("rule-1", "Move rule down");

        await waitFor(() => {
            expect(screen.getByRole("status").textContent).toBe("Rule moved to position 2 of 3.");
        });

        press("rule-1", "Move rule down");

        await waitFor(() => {
            expect(screen.getByRole("status").textContent).toBe("Rule moved to position 3 of 3.");
        });
    });

    it("announces a repeated identical position again: the text is cleared between the two (final wave 12)", async () => {
        renderRules(createForm(createRules()));
        const texts: string[] = [];
        const observer = new MutationObserver(() => {
            texts.push(screen.getByRole("status").textContent ?? "");
        });
        observer.observe(screen.getByRole("status"), {
            childList: true,
            characterData: true,
            subtree: true
        });

        press("rule-3", "Move rule up");
        await waitFor(() => expect(texts).toContain("Rule moved to position 2 of 3."));
        press("rule-1", "Move rule down");
        await waitFor(() => {
            const same = texts.filter(text => text === "Rule moved to position 2 of 3.");
            expect(same).toHaveLength(2);
        });
        observer.disconnect();

        expect(texts).toContain("");
        expect(screen.getByRole("status").textContent).toBe("Rule moved to position 2 of 3.");
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
            within(getCard("rule-1")).getByRole("button", {
                name: "Then assign to: choose Ana Kovač"
            })
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
                    createReferenceLabel({
                        id: "f9",
                        label: "Restricted folder",
                        state: "restricted"
                    })
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
            within(getCard("rule-2")).getByRole("button", {
                name: "Then assign to: choose Ana Kovač"
            })
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
