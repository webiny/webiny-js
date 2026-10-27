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
        // A stored key the editor does not know is not written back.
        const step = createReviewStep({
            config: { teams: ["team-1"], assignment: STORED_ASSIGNMENT, legacy: 1 }
        });
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
