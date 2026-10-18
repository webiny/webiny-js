import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { createStepFormOptions } from "~/editor/testing/createStepFormOptions.js";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { renderStepFormField } from "~/editor/testing/renderStepFormField.js";
import type { StepFormTransportsOptions } from "../StepFormOptions.js";
import { buildPeopleStepForm } from "../buildPeopleStepForm.js";
import { TransportCheckboxesRenderer } from "./TransportCheckboxesRenderer.js";

const HINT =
    "In-app notifications are always sent. Who gets notified is set automatically from the step.";

const createForm = (notifications: string[]) => {
    const form = createTestFormModelFactory().create(buildPeopleStepForm());
    form.setData({ notifications }, { dirty: false });
    return form;
};

const transports = (
    overrides: Partial<StepFormTransportsOptions> = {}
): StepFormTransportsOptions => {
    return {
        loading: false,
        failed: false,
        retry: vi.fn(),
        options: [
            { id: "e-mail", title: "E-mail", description: "Sends an e-mail" },
            { id: "slack", title: "Slack", description: null }
        ],
        ...overrides
    };
};

const renderTransports = (
    form: ReturnType<typeof createForm>,
    options: StepFormTransportsOptions
) => {
    renderStepFormField({
        form,
        name: "notifications",
        Renderer: TransportCheckboxesRenderer,
        options: createStepFormOptions({ transports: options })
    });
};

describe("TransportCheckboxesRenderer (R272, D151)", () => {
    afterEach(() => {
        cleanup();
    });

    it("lists one checkbox per transport, with the description after the title", () => {
        renderTransports(createForm(["e-mail"]), transports());

        const email = screen.getByRole("checkbox", { name: "E-mail · Sends an e-mail" });
        const slack = screen.getByRole("checkbox", { name: "Slack" });
        expect(email.getAttribute("aria-checked")).toBe("true");
        expect(slack.getAttribute("aria-checked")).toBe("false");
        expect(screen.getByText(HINT)).toBeDefined();
    });

    it("ticks a transport and keeps the ids it does not list", () => {
        const form = createForm(["legacy-sms"]);
        renderTransports(form, transports());

        fireEvent.click(screen.getByRole("checkbox", { name: "Slack" }));

        expect(form.field("notifications").getValue()).toEqual(["legacy-sms", "slack"]);
    });

    it("unticks only the clicked transport", () => {
        const form = createForm(["legacy-sms", "e-mail", "slack"]);
        renderTransports(form, transports());

        fireEvent.click(screen.getByRole("checkbox", { name: "E-mail · Sends an e-mail" }));

        expect(form.field("notifications").getValue()).toEqual(["legacy-sms", "slack"]);
    });

    it("never shows an id the list does not contain", () => {
        renderTransports(createForm(["legacy-sms"]), transports());

        expect(screen.queryByText("legacy-sms")).toBeNull();
        expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    });

    it("says only in-app notifications exist when there are no transports, and keeps the hint", () => {
        renderTransports(createForm([]), transports({ options: [] }));

        expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
        expect(
            screen.getByText(
                "Only in-app notifications are available. No other channels are configured."
            )
        ).toBeDefined();
        expect(screen.getByText(HINT)).toBeDefined();
    });

    it("does not claim there are no transports while the list loads", () => {
        renderTransports(createForm([]), transports({ options: [], loading: true }));

        expect(
            screen.queryByText(
                "Only in-app notifications are available. No other channels are configured."
            )
        ).toBeNull();
        expect(screen.getByText(HINT)).toBeDefined();
    });

    it("shows the options failure with Try again", () => {
        const retry = vi.fn();
        renderTransports(createForm([]), transports({ options: [], failed: true, retry }));

        expect(screen.getByText("Could not load the step options.")).toBeDefined();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(retry).toHaveBeenCalledTimes(1);
    });
});
