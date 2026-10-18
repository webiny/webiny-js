import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { buildPeopleStepForm } from "./buildPeopleStepForm.js";
import { getPeopleFormData } from "./getPeopleFormData.js";
import { getPeopleStepPatch } from "./getPeopleStepPatch.js";
import { STEP_FORM_RENDERER } from "./stepFormRendererNames.js";

const createForm = () => {
    return createTestFormModelFactory().create(buildPeopleStepForm());
};

describe("buildPeopleStepForm (R270)", () => {
    it("has the common fields and the teams field, in the design order, with no tabs", () => {
        const form = createForm();
        const names = form.vm.layout.flatMap(node => {
            return node.type === "row" ? node.fields.map(field => field.name) : [node.type];
        });

        expect(names).toEqual(["title", "color", "description", "teams", "notifications"]);
    });

    it("describes the teams field (the hint is the first sentence only, R270)", () => {
        const teams = createForm().field("teams").vm;

        expect(teams.label).toBe("Reviewing teams");
        expect(teams.description).toBe("Members of these teams can review.");
        expect(teams.renderer).toBe(STEP_FORM_RENDERER.teams);
        expect(teams.isList).toBe(true);
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
            notifications: ["e-mail"]
        });
    });
});

describe("getPeopleFormData", () => {
    it("lists the stored team ids and ignores anything that is not a string", () => {
        const step = createReviewStep({ config: { teams: ["team-1", 7, null, "team-2"] } });

        expect(getPeopleFormData(step).teams).toEqual(["team-1", "team-2"]);
    });

    it("is an empty list for a step with no teams", () => {
        expect(getPeopleFormData(createReviewStep({ config: {} })).teams).toEqual([]);
        expect(getPeopleFormData(createReviewStep({ config: null })).teams).toEqual([]);
    });
});

describe("getPeopleStepPatch (R270, Review Focus 3)", () => {
    const values = {
        title: "Legal review",
        color: "var(--color-warning-600)",
        description: null,
        notifications: ["e-mail"],
        teams: ["team-2"]
    };

    it("writes exactly the People config keys: teams and assignment", () => {
        const patch = getPeopleStepPatch(createReviewStep(), values);

        expect(patch.config).toEqual({
            teams: ["team-2"],
            assignment: { strategy: "none", allowManualPick: false, rules: [] }
        });
    });

    it("carries the stored assignment unchanged (9b edits it)", () => {
        const assignment = {
            strategy: "roundRobin",
            allowManualPick: true,
            rules: [{ id: "rule-1", teamId: "team-1" }]
        };
        const step = createReviewStep({ config: { teams: ["team-1"], assignment } });

        expect(getPeopleStepPatch(step, values).config).toEqual({ teams: ["team-2"], assignment });
    });

    it("defaults the assignment only when the step has none", () => {
        const step = createReviewStep({ config: { teams: ["team-1"] } });

        expect(getPeopleStepPatch(step, values).config).toEqual({
            teams: ["team-2"],
            assignment: { strategy: "none", allowManualPick: false, rules: [] }
        });
    });

    it("includes the common fields and treats missing teams as an empty list", () => {
        const patch = getPeopleStepPatch(createReviewStep(), { ...values, teams: null });

        expect(patch.title).toBe("Legal review");
        expect(patch.config).toEqual({
            teams: [],
            assignment: { strategy: "none", allowManualPick: false, rules: [] }
        });
    });
});
