import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createStepFormOptions } from "~/editor/testing/createStepFormOptions.js";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { renderStepFormField } from "~/editor/testing/renderStepFormField.js";
import type { StepFormAutomationsOptions } from "../StepFormOptions.js";
import { buildAutomationStepForm } from "../buildAutomationStepForm.js";
import { AutomationCardsRenderer } from "./AutomationCardsRenderer.js";

const automations = (
    overrides: Partial<StepFormAutomationsOptions> = {}
): StepFormAutomationsOptions => {
    return {
        loading: false,
        failed: false,
        retry: vi.fn(),
        options: [
            { id: "send-webhook", name: "Send webhook", description: "Sends the review to a URL." },
            { id: "post-to-slack", name: "Post to Slack", description: null }
        ],
        emptyText: "No automations are available for this model.",
        warning: null,
        settingsWarning: null,
        select: vi.fn(),
        ...overrides
    };
};

const renderCards = (automationId: string | null, options: StepFormAutomationsOptions) => {
    const form = createTestFormModelFactory().create(
        buildAutomationStepForm({ definition: createWebhookAutomation() })
    );
    form.setData({ automationId }, { dirty: false });
    renderStepFormField({
        form,
        name: "automationId",
        Renderer: AutomationCardsRenderer,
        options: createStepFormOptions({ automations: options })
    });
    return form;
};

describe("AutomationCardsRenderer (R274)", () => {
    afterEach(() => {
        cleanup();
    });

    it("lists the automations as radio cards with name and description, the stored one selected", () => {
        renderCards("send-webhook", automations());

        const webhook = screen.getByRole("radio", { name: /Send webhook/ });
        const slack = screen.getByRole("radio", { name: /Post to Slack/ });
        expect(webhook.getAttribute("aria-checked")).toBe("true");
        expect(slack.getAttribute("aria-checked")).toBe("false");
        expect(screen.getByText("Sends the review to a URL.")).toBeDefined();
        expect(screen.getByText("Automation")).toBeDefined();
    });

    it("names the radio group by the Automation label", () => {
        renderCards("send-webhook", automations());

        expect(screen.getByRole("radiogroup", { name: /^Automation/ })).toBeDefined();
    });

    it("asks the options to select instead of changing the field (the presenter decides, QBZ-14)", () => {
        const select = vi.fn();
        const form = renderCards("send-webhook", automations({ select }));

        fireEvent.click(screen.getByRole("radio", { name: /Post to Slack/ }));

        expect(select).toHaveBeenCalledWith("post-to-slack");
        expect(form.field("automationId").getValue()).toBe("send-webhook");
    });

    it("shows the reason when no automation covers the model", () => {
        renderCards(null, automations({ options: [] }));

        expect(screen.queryAllByRole("radio")).toHaveLength(0);
        expect(screen.getByText("No automations are available for this model.")).toBeDefined();
    });

    it("shows the missing-automation and stale-settings warnings", () => {
        renderCards(
            "gone",
            automations({
                warning: "The automation “gone” no longer exists.",
                settingsWarning: "Saved settings no longer validate: URL is required."
            })
        );

        expect(screen.getByText("The automation “gone” no longer exists.")).toBeDefined();
        expect(
            screen.getByText("Saved settings no longer validate: URL is required.")
        ).toBeDefined();
    });

    it("shows only the label while the list loads", () => {
        renderCards(null, automations({ options: [], loading: true }));

        expect(screen.getByText("Automation")).toBeDefined();
        expect(screen.queryByText("No automations are available for this model.")).toBeNull();
    });

    it("shows the options failure with Try again", () => {
        const retry = vi.fn();
        renderCards(null, automations({ options: [], failed: true, retry }));

        expect(screen.getByText("Could not load the step options.")).toBeDefined();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(retry).toHaveBeenCalledTimes(1);
    });

    it("shows a server error on the automation field", () => {
        const form = createTestFormModelFactory().create(
            buildAutomationStepForm({ definition: createWebhookAutomation() })
        );
        form.field("automationId").setValidation({
            isValid: false,
            message: "The automation is not available for this model."
        });
        renderStepFormField({
            form,
            name: "automationId",
            Renderer: AutomationCardsRenderer,
            options: createStepFormOptions({ automations: automations() })
        });

        expect(screen.getByText("The automation is not available for this model.")).toBeDefined();
    });
});
