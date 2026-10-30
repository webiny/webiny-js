import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { within } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import type { StepTypeOption } from "~/editor/model/getStepTypeOptions.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { StepTypePicker } from "./StepTypePicker.js";
import type { StepTypePickerProps } from "./StepTypePicker.js";

const PEOPLE: StepTypeOption = {
    type: "review",
    label: "People",
    description: "Members of one or more teams review.",
    addable: true,
    reason: null
};

const AUTOMATION: StepTypeOption = {
    type: "automation",
    label: "Automation",
    description: "Runs a code-defined automation, such as Send webhook.",
    addable: true,
    reason: null
};

const AI: StepTypeOption = {
    type: "ai",
    label: "AI",
    description: "An AI model reviews against your written instructions.",
    addable: true,
    reason: null
};

const createProps = (overrides: Partial<StepTypePickerProps> = {}): StepTypePickerProps => {
    return {
        options: [PEOPLE, AUTOMATION, AI],
        onPick: vi.fn(),
        onClose: vi.fn(),
        ...overrides
    };
};

describe("StepTypePicker", () => {
    it("shows the title, the hint and one card per type in the given order", () => {
        renderWithAdminUi(<StepTypePicker {...createProps()} />);

        expect(screen.getByText("Add step")).toBeTruthy();
        expect(
            screen.getByText("Choose who or what does this step. You can't change the type later.")
        ).toBeTruthy();

        const cards = screen.getAllByTestId(/^step-type-[a-z]+$/);
        expect(cards.map(card => card.getAttribute("data-testid"))).toEqual([
            "step-type-review",
            "step-type-automation",
            "step-type-ai"
        ]);
        expect(screen.getByText("Members of one or more teams review.")).toBeTruthy();
        expect(
            screen.getByText("Runs a code-defined automation, such as Send webhook.")
        ).toBeTruthy();
        expect(
            screen.getByText("An AI model reviews against your written instructions.")
        ).toBeTruthy();
    });

    it("picks an addable type", () => {
        const props = createProps();
        renderWithAdminUi(<StepTypePicker {...props} />);

        fireEvent.click(screen.getByText("Automation"));

        expect(props.onPick).toHaveBeenCalledTimes(1);
        expect(props.onPick).toHaveBeenCalledWith("automation");
        expect(props.onClose).not.toHaveBeenCalled();
    });

    it("lists AI as disabled with the licence reason and cannot pick it", () => {
        const ai: StepTypeOption = {
            ...AI,
            addable: false,
            reason: "Requires the AI Power-Ups licence."
        };
        const props = createProps({ options: [PEOPLE, AUTOMATION, ai] });
        renderWithAdminUi(<StepTypePicker {...props} />);

        expect(screen.getByText("Requires the AI Power-Ups licence.")).toBeTruthy();
        const card = screen.getByTestId("step-type-ai");
        expect(card.getAttribute("aria-disabled")).toBe("true");
        fireEvent.click(within(card).getByText(/./, { selector: "div" }));
        expect(props.onPick).not.toHaveBeenCalled();
    });

    it("describes a disabled card by its reason text", () => {
        const ai: StepTypeOption = {
            ...AI,
            addable: false,
            reason: "Requires the AI Power-Ups licence."
        };
        const props = createProps({ options: [PEOPLE, AUTOMATION, ai] });
        renderWithAdminUi(<StepTypePicker {...props} />);

        const card = screen.getByTestId("step-type-ai");
        const describedBy = card.getAttribute("aria-describedby");

        expect(describedBy).not.toBeNull();
        expect(document.getElementById(describedBy ?? "")?.textContent).toBe(
            "Requires the AI Power-Ups licence."
        );
        expect(screen.getByTestId("step-type-review").getAttribute("aria-describedby")).toBeNull();
    });

    it("lists Automation as disabled with the model reason", () => {
        const automation: StepTypeOption = {
            ...AUTOMATION,
            addable: false,
            reason: "No automations are available for this model."
        };
        const props = createProps({ options: [PEOPLE, automation, AI] });
        renderWithAdminUi(<StepTypePicker {...props} />);

        expect(screen.getByText("No automations are available for this model.")).toBeTruthy();
        expect(screen.getByTestId("step-type-automation").getAttribute("aria-disabled")).toBe(
            "true"
        );
        expect(screen.getByTestId("step-type-review").getAttribute("aria-disabled")).toBeNull();
    });

    it("shows the Website Builder reason as the presenter gives it", () => {
        const automation: StepTypeOption = {
            ...AUTOMATION,
            addable: false,
            reason: "No automations are available for pages."
        };
        renderWithAdminUi(<StepTypePicker {...createProps({ options: [PEOPLE, automation] })} />);

        expect(screen.getByText("No automations are available for pages.")).toBeTruthy();
    });

    it("shows no reason on an addable card", () => {
        renderWithAdminUi(<StepTypePicker {...createProps()} />);

        expect(screen.queryByText("Requires the AI Power-Ups licence.")).toBeNull();
        expect(screen.queryByText("No automations are available for this model.")).toBeNull();
    });

    it("lists an unknown type disabled with the server's reason and no description", () => {
        const custom: StepTypeOption = {
            type: "custom",
            label: "Custom check",
            description: null,
            addable: false,
            reason: "Requires the custom add-on."
        };
        const props = createProps({ options: [PEOPLE, custom] });
        renderWithAdminUi(<StepTypePicker {...props} />);

        expect(screen.getByText("Custom check")).toBeTruthy();
        expect(screen.getByText("Requires the custom add-on.")).toBeTruthy();
        const card = screen.getByTestId("step-type-custom");
        expect(card.getAttribute("aria-disabled")).toBe("true");
        fireEvent.click(within(card).getByText(/./, { selector: "div" }));
        expect(props.onPick).not.toHaveBeenCalled();
    });

    it("closes on Escape without picking", async () => {
        const props = createProps();
        renderWithAdminUi(<StepTypePicker {...props} />);

        fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

        await waitFor(() => expect(props.onClose).toHaveBeenCalledTimes(1));
        expect(props.onPick).not.toHaveBeenCalled();
    });

    it("lists the types as a list of items, each with its type icon", () => {
        renderWithAdminUi(<StepTypePicker {...createProps()} />);

        const cards = screen.getAllByTestId(/^step-type-[a-z]+$/);
        expect(cards).toHaveLength(3);
        cards.forEach(card => {
            expect(card.querySelector("svg")).not.toBeNull();
        });
    });

    it("picks an addable type with the keyboard", () => {
        const props = createProps();
        renderWithAdminUi(<StepTypePicker {...props} />);

        const card = screen.getByTestId("step-type-ai");
        expect(card.getAttribute("tabindex")).toBe("0");
        fireEvent.keyDown(card, { key: "Enter" });

        expect(props.onPick).toHaveBeenCalledWith("ai");
    });

    it("does not pick a disabled type with the keyboard", () => {
        const ai: StepTypeOption = {
            ...AI,
            addable: false,
            reason: "Requires the AI Power-Ups licence."
        };
        const props = createProps({ options: [PEOPLE, AUTOMATION, ai] });
        renderWithAdminUi(<StepTypePicker {...props} />);

        fireEvent.keyDown(screen.getByTestId("step-type-ai"), { key: "Enter" });

        expect(props.onPick).not.toHaveBeenCalled();
    });

    it("shows the reason of a disabled card with a lock icon", () => {
        const ai: StepTypeOption = {
            ...AI,
            addable: false,
            reason: "Requires the AI Power-Ups licence."
        };
        renderWithAdminUi(
            <StepTypePicker {...createProps({ options: [PEOPLE, AUTOMATION, ai] })} />
        );

        const reason = screen.getByText("Requires the AI Power-Ups licence.");
        expect(reason.parentElement?.querySelector("svg")).not.toBeNull();
        expect(screen.getByTestId("step-type-ai").getAttribute("aria-describedby")).toBe(reason.id);
    });
});
