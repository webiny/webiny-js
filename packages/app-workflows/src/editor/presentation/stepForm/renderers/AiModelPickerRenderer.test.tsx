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
import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { StepFormAiModelsOptions } from "../StepFormOptions.js";
import { buildAiStepForm } from "../buildAiStepForm.js";
import { AiModelPickerRenderer } from "./AiModelPickerRenderer.js";

interface ModelPickerStubProps {
    label: string;
    description?: string;
    required?: boolean;
    value: string | null;
    selected: PickerOption | null;
    options: PickerOption[];
    placeholder: string;
    disabled: boolean;
    error: string | null;
    onChange(id: string | null): void;
    onSearch(search: string): void;
}

// A stub of the Task 4 picker: it exposes the props the renderer passes and two buttons.
vi.mock("~/components/picker/WorkflowPicker.js", async () => {
    const react = await import("react");
    return {
        WorkflowPicker: (props: ModelPickerStubProps) => {
            return react.createElement(
                "div",
                {
                    "data-testid": "model-picker",
                    "data-label": props.label,
                    "data-description": props.description ?? "",
                    "data-required": String(props.required ?? false),
                    "data-value": props.value ?? "",
                    "data-selected": props.selected?.label ?? "",
                    "data-warning": props.selected?.warning ?? "",
                    "data-options": props.options.map(option => option.id).join(","),
                    "data-placeholder": props.placeholder,
                    "data-disabled": String(props.disabled),
                    "data-error": props.error ?? ""
                },
                react.createElement(
                    "button",
                    { onClick: () => props.onChange("openai/gpt-fast") },
                    "pick"
                ),
                react.createElement("button", { onClick: () => props.onChange(null) }, "clear"),
                react.createElement("button", { onClick: () => props.onSearch("gpt") }, "search")
            );
        }
    };
});

const MODEL: PickerOption = {
    id: "anthropic/claude-balanced",
    label: "Claude Balanced",
    description: "Anthropic",
    warning: null
};

const aiModels = (overrides: Partial<StepFormAiModelsOptions> = {}): StepFormAiModelsOptions => {
    return {
        loading: false,
        failed: false,
        retry: vi.fn(),
        options: [MODEL],
        selected: null,
        empty: false,
        search: vi.fn(),
        ...overrides
    };
};

const renderModel = (model: string | null, options: StepFormAiModelsOptions) => {
    const form = createTestFormModelFactory().create(buildAiStepForm({ readOnly: false }));
    form.setData({ model }, { dirty: false });
    renderStepFormField({
        form,
        name: "model",
        Renderer: AiModelPickerRenderer,
        options: createStepFormOptions({ aiModels: options })
    });
    return form;
};

describe("AiModelPickerRenderer (R275, QBZ-8, QBZ-89)", () => {
    afterEach(() => {
        cleanup();
    });

    it("passes the label, description, value, options, selected model and placeholder to the picker", () => {
        renderModel("anthropic/claude-balanced", aiModels({ selected: MODEL }));

        const picker = screen.getByTestId("model-picker");
        expect(picker.getAttribute("data-value")).toBe("anthropic/claude-balanced");
        expect(picker.getAttribute("data-selected")).toBe("Claude Balanced");
        expect(picker.getAttribute("data-options")).toBe("anthropic/claude-balanced");
        expect(picker.getAttribute("data-placeholder")).toBe("Search models");
        expect(picker.getAttribute("data-disabled")).toBe("false");
        expect(picker.getAttribute("data-label")).toBe("Model");
        expect(picker.getAttribute("data-description")).toBe(
            "Models available through AI Power-Ups."
        );
        expect(picker.getAttribute("data-required")).toBe("true");
    });

    it("writes the picked id to the field, clears it with null and forwards a search", () => {
        const search = vi.fn();
        const form = renderModel(null, aiModels({ search }));

        fireEvent.click(screen.getByText("pick"));
        expect(form.field("model").getValue()).toBe("openai/gpt-fast");

        fireEvent.click(screen.getByText("clear"));
        expect(form.field("model").getValue()).toBeNull();

        fireEvent.click(screen.getByText("search"));
        expect(search).toHaveBeenCalledWith("gpt");
    });

    it("passes a retired model's label and warning through (QBZ-8)", () => {
        const retired: PickerOption = {
            id: "anthropic/gone",
            label: "anthropic/gone (no longer offered)",
            description: null,
            warning:
                "The AI model “anthropic/gone” is no longer offered. Choose another model; until then this step fails when reached."
        };
        renderModel("anthropic/gone", aiModels({ selected: retired }));

        const picker = screen.getByTestId("model-picker");
        expect(picker.getAttribute("data-selected")).toBe("anthropic/gone (no longer offered)");
        expect(picker.getAttribute("data-warning")).toBe(retired.warning);
    });

    it("shows the no-model error under the field when validated", async () => {
        const form = createTestFormModelFactory().create(buildAiStepForm({ readOnly: false }));
        await form.field("model").validate({ force: true });
        renderStepFormField({
            form,
            name: "model",
            Renderer: AiModelPickerRenderer,
            options: createStepFormOptions({ aiModels: aiModels() })
        });

        expect(screen.getByTestId("model-picker").getAttribute("data-error")).toBe(
            "Choose an AI model."
        );
    });

    it("disables the picker and offers Retry when the list failed (QBZ-89)", () => {
        const retry = vi.fn();
        renderModel(
            "anthropic/claude-balanced",
            aiModels({ failed: true, retry, options: [], selected: MODEL })
        );

        const picker = screen.getByTestId("model-picker");
        expect(picker.getAttribute("data-disabled")).toBe("true");
        expect(picker.getAttribute("data-selected")).toBe("Claude Balanced");
        expect(screen.getByText("Could not load AI models.")).toBeDefined();

        fireEvent.click(screen.getByRole("button", { name: "Retry" }));

        expect(retry).toHaveBeenCalledTimes(1);
    });

    it("disables the picker and explains when the list is empty (QBZ-89)", () => {
        renderModel(null, aiModels({ empty: true, options: [] }));

        expect(screen.getByTestId("model-picker").getAttribute("data-disabled")).toBe("true");
        expect(
            screen.getByText("No AI models are available. Check the AI Power-Ups configuration.")
        ).toBeDefined();
        expect(screen.queryByText("Could not load AI models.")).toBeNull();
    });

    it("shows no list message while the models load", () => {
        renderModel(null, aiModels({ loading: true, options: [] }));

        expect(screen.queryByText("Could not load AI models.")).toBeNull();
        expect(
            screen.queryByText("No AI models are available. Check the AI Power-Ups configuration.")
        ).toBeNull();
    });
});
