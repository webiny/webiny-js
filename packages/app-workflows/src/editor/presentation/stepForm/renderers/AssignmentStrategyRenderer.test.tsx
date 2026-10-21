import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { SwitchRenderer } from "@webiny/app-admin/base/Base/FieldRenderers/SwitchRenderer.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { renderStepFormField } from "~/editor/testing/renderStepFormField.js";
import { buildPeopleStepForm } from "../buildPeopleStepForm.js";
import { getPeopleFormData } from "../getPeopleFormData.js";
import { ASSIGNMENT_STRATEGY_CARDS } from "../assignmentStrategyCards.js";
import { AssignmentStrategyRenderer } from "./AssignmentStrategyRenderer.js";

const createForm = (strategy: string | null, readOnly = false) => {
    const form = createTestFormModelFactory().create(buildPeopleStepForm({ readOnly }));
    const values = getPeopleFormData(createReviewStep());
    form.setData({ ...values, assignment: { ...values.assignment, strategy } }, { dirty: false });
    return form;
};

const renderStrategy = (form: ReturnType<typeof createForm>) => {
    renderStepFormField({
        form,
        name: "assignment.strategy",
        Renderer: AssignmentStrategyRenderer
    });
};

const getRadio = (name: RegExp) => {
    return screen.getByRole("radio", { name });
};

describe("AssignmentStrategyRenderer (R297, R305)", () => {
    afterEach(() => {
        cleanup();
    });

    it("has the three cards, in the design order, with the design's names and descriptions", () => {
        expect(ASSIGNMENT_STRATEGY_CARDS).toEqual([
            {
                value: "none",
                name: "None (team pool)",
                description: "The step waits in the team pool until a team member starts it."
            },
            {
                value: "roundRobin",
                name: "Round-robin",
                description: "Takes turns across eligible team members."
            },
            {
                value: "leastLoaded",
                name: "Least-loaded",
                description: "Picks the eligible member with the fewest open reviews."
            }
        ]);
    });

    it("renders one radio per strategy with its name and description under the Strategy label", () => {
        renderStrategy(createForm("none"));

        expect(getRadio(/None \(team pool\)/)).toBeDefined();
        expect(getRadio(/Round-robin/)).toBeDefined();
        expect(getRadio(/Least-loaded/)).toBeDefined();
        expect(screen.getAllByRole("radio")).toHaveLength(3);
        expect(
            screen.getByText("The step waits in the team pool until a team member starts it.")
        ).toBeDefined();
        expect(screen.getByText("Takes turns across eligible team members.")).toBeDefined();
        expect(
            screen.getByText("Picks the eligible member with the fewest open reviews.")
        ).toBeDefined();
        expect(screen.getByText("Strategy")).toBeDefined();
    });

    it("names the radio group by the Strategy label", () => {
        renderStrategy(createForm("none"));

        expect(screen.getByRole("radiogroup", { name: "Strategy" })).toBeDefined();
    });

    it("selects the card of the stored strategy", () => {
        renderStrategy(createForm("roundRobin"));

        expect(getRadio(/None \(team pool\)/).getAttribute("aria-checked")).toBe("false");
        expect(getRadio(/Round-robin/).getAttribute("aria-checked")).toBe("true");
        expect(getRadio(/Least-loaded/).getAttribute("aria-checked")).toBe("false");
    });

    it("writes the stored value of the clicked card and selects it", () => {
        const form = createForm("none");
        renderStrategy(form);

        fireEvent.click(getRadio(/Least-loaded/));

        expect(form.field("assignment.strategy").getValue()).toBe("leastLoaded");
        expect(getRadio(/Least-loaded/).getAttribute("aria-checked")).toBe("true");
        expect(getRadio(/None \(team pool\)/).getAttribute("aria-checked")).toBe("false");
        expect(form.isDirty).toBe(true);
    });

    it("shows no card selected for a stored strategy the editor does not know, and rewrites nothing until one is picked (R314)", () => {
        const form = createForm(null);
        renderStrategy(form);

        for (const radio of screen.getAllByRole("radio")) {
            expect(radio.getAttribute("aria-checked")).toBe("false");
        }
        expect(form.field("assignment.strategy").getValue()).toBeNull();

        fireEvent.click(getRadio(/Round-robin/));

        expect(form.field("assignment.strategy").getValue()).toBe("roundRobin");
    });

    it("disables the cards and ignores a click when the step is read-only (R309)", () => {
        const form = createForm("none", true);
        renderStrategy(form);

        for (const radio of screen.getAllByRole("radio")) {
            const button: HTMLButtonElement = radio as HTMLButtonElement;
            expect(button.disabled).toBe(true);
        }
        fireEvent.click(getRadio(/Least-loaded/));

        expect(form.field("assignment.strategy").getValue()).toBe("none");
    });

    it("shows a server error of the strategy field under the cards", () => {
        const form = createForm("none");
        form.field("assignment.strategy").setValidation({
            isValid: false,
            message: "Strategy is not allowed."
        });
        renderStrategy(form);

        expect(screen.getByText("Strategy is not allowed.")).toBeDefined();
    });

    it("renders the toggle with its label and hint, independent of the strategy", () => {
        const form = createForm("roundRobin");
        renderStrategy(form);
        renderStepFormField({ form, name: "assignment.allowManualPick", Renderer: SwitchRenderer });

        expect(screen.getByText("Let the requester pick a reviewer")).toBeDefined();
        expect(
            screen.getByText(
                "The requester can choose a person from this step's eligible reviewers when requesting a review. Picks are checked again when the step is reached."
            )
        ).toBeDefined();

        const toggle = screen.getByRole("switch");
        expect(toggle.getAttribute("aria-checked")).toBe("false");

        fireEvent.click(toggle);

        expect(form.field("assignment.allowManualPick").getValue()).toBe(true);
        expect(form.field("assignment.strategy").getValue()).toBe("roundRobin");

        fireEvent.click(getRadio(/Least-loaded/));

        expect(form.field("assignment.strategy").getValue()).toBe("leastLoaded");
        expect(form.field("assignment.allowManualPick").getValue()).toBe(true);
        expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("true");
    });

    it("wraps a long strategy description inside the drawer", () => {
        renderStrategy(createForm("none"));

        const description = screen.getByText("Takes turns across eligible team members.");
        const card = description.parentElement as HTMLElement;
        expect(description.classList.contains("break-words")).toBe(true);
        expect(card.classList.contains("whitespace-normal")).toBe(true);
        expect(card.classList.contains("min-w-0")).toBe(true);
    });
});
