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
import { createStepFormOptions } from "~/editor/testing/createStepFormOptions.js";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { renderStepFormField } from "~/editor/testing/renderStepFormField.js";
import type { StepFormAiToolsOptions } from "../StepFormOptions.js";
import { buildAiStepForm } from "../buildAiStepForm.js";
import { AiToolsRenderer } from "./AiToolsRenderer.js";

const tools = (overrides: Partial<StepFormAiToolsOptions> = {}): StepFormAiToolsOptions => {
    return {
        loading: false,
        failed: false,
        retry: vi.fn(),
        options: [
            {
                name: "read-fields",
                label: "Read fields",
                summary: "Reads every field of the revision under review.",
                changesContent: false
            },
            {
                name: "update-fields",
                label: "Update fields",
                summary: "Edits field values in the revision under review.",
                changesContent: true
            },
            {
                name: "check-links",
                label: "Check links",
                summary: "Opens links in the content and reports broken ones.",
                changesContent: false
            }
        ],
        ...overrides
    };
};

const createForm = (stored: string[], readOnly = false) => {
    const form = createTestFormModelFactory().create(buildAiStepForm({ readOnly }));
    form.setData({ tools: stored }, { dirty: false });
    return form;
};

const renderTools = (form: ReturnType<typeof createForm>, options: StepFormAiToolsOptions) => {
    renderStepFormField({
        form,
        name: "tools",
        Renderer: AiToolsRenderer,
        options: createStepFormOptions({ aiTools: options })
    });
};

describe("AiToolsRenderer (R275)", () => {
    afterEach(() => {
        cleanup();
    });

    it("lists one checkbox per tool with its label and summary, the stored ones ticked", () => {
        renderTools(createForm(["read-fields"]), tools());

        const read = screen.getByRole("checkbox", { name: /Read fields/ });
        const links = screen.getByRole("checkbox", { name: /Check links/ });
        expect(read.getAttribute("aria-checked")).toBe("true");
        expect(links.getAttribute("aria-checked")).toBe("false");
        expect(screen.getByText("Reads every field of the revision under review.")).toBeDefined();
        expect(screen.getByText("Tools")).toBeDefined();
    });

    it("tags only the tool that changes content, and shows the hint under the list (R283)", () => {
        renderTools(createForm([]), tools());

        expect(screen.getAllByText("Changes content")).toHaveLength(1);
        expect(
            screen.getByRole("checkbox", { name: /Update fields.*Changes content/ })
        ).toBeDefined();
        expect(
            screen.getByText(
                "Tools marked “Changes content” can edit the revision while it is in review. The editor reloads and tells the author when that happens."
            )
        ).toBeDefined();
    });

    it("shows no hint in the loading, failed and empty states", () => {
        const hint =
            "Tools marked “Changes content” can edit the revision while it is in review. The editor reloads and tells the author when that happens.";

        renderTools(createForm([]), tools({ options: [], loading: true }));
        expect(screen.queryByText(hint)).toBeNull();
        cleanup();
        renderTools(createForm([]), tools({ options: [], failed: true }));
        expect(screen.queryByText(hint)).toBeNull();
        cleanup();
        renderTools(createForm([]), tools({ options: [] }));
        expect(screen.queryByText(hint)).toBeNull();
    });

    it("groups the tools under the label and describes the group by the hint", () => {
        renderTools(createForm([]), tools());

        const group = screen.getByRole("group", { name: "Tools" });

        expect(group.getAttribute("aria-describedby")).not.toBeNull();
        expect(group.textContent).toContain("Tools marked");
        expect(within(group).getAllByRole("checkbox")).toHaveLength(3);
    });

    it("disables every tool and ignores a click when the step is read-only", () => {
        const form = createForm(["read-fields"], true);
        renderTools(form, tools());

        const checkboxes = screen.getAllByRole("checkbox");
        for (const checkbox of checkboxes) {
            expect(checkbox.hasAttribute("disabled")).toBe(true);
        }
        fireEvent.click(screen.getByRole("checkbox", { name: /Check links/ }));

        expect(form.field("tools").getValue()).toEqual(["read-fields"]);
    });

    it("ticks a tool and keeps the stored names the list does not offer", () => {
        const form = createForm(["gone"]);
        renderTools(form, tools());

        fireEvent.click(screen.getByRole("checkbox", { name: /Check links/ }));

        expect(form.field("tools").getValue()).toEqual(["gone", "check-links"]);
    });

    it("unticks only the clicked tool", () => {
        const form = createForm(["gone", "read-fields", "check-links"]);
        renderTools(form, tools());

        fireEvent.click(screen.getByRole("checkbox", { name: /Read fields/ }));

        expect(form.field("tools").getValue()).toEqual(["gone", "check-links"]);
    });

    it("never shows a stored name the list does not contain", () => {
        renderTools(createForm(["gone"]), tools());

        expect(screen.queryByText("gone")).toBeNull();
        expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    });

    it("shows a server error on the tools field under the list", () => {
        const form = createForm([]);
        form.field("tools").setValidation({
            isValid: false,
            message: "Tool “gone” is not defined."
        });
        renderTools(form, tools());

        expect(screen.getByText("Tool “gone” is not defined.")).toBeDefined();
    });

    it("shows the options failure with Try again", () => {
        const retry = vi.fn();
        renderTools(createForm([]), tools({ options: [], failed: true, retry }));

        expect(screen.getByText("Could not load the step options.")).toBeDefined();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(retry).toHaveBeenCalledTimes(1);
    });

    it("shows only the label while the tools load", () => {
        renderTools(createForm([]), tools({ options: [], loading: true }));

        expect(screen.getByText("Tools")).toBeDefined();
        expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    });

    it("renders nothing when the list loaded with no tool (there is no copy for it)", () => {
        renderTools(createForm([]), tools({ options: [] }));

        expect(screen.queryByText("Tools")).toBeNull();
        expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    });

    it("shows a server error on the tools field even when no tool is offered", () => {
        const form = createForm(["gone"]);
        form.field("tools").setValidation({
            isValid: false,
            message: "Tool “gone” is not defined."
        });
        renderTools(form, tools({ options: [] }));

        expect(screen.getByText("Tools")).toBeDefined();
        expect(screen.getByText("Tool “gone” is not defined.")).toBeDefined();
        expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    });
});
