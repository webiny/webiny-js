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
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import { buildPeopleStepForm } from "../buildPeopleStepForm.js";
import { STEP_FORM_RENDERER } from "../stepFormRendererNames.js";
import { TeamsPickerRenderer } from "./TeamsPickerRenderer.js";

interface MultiPickerStubProps {
    label: string;
    description?: string;
    required?: boolean;
    values: string[];
    selected: PickerOption[];
    options: PickerOption[];
    placeholder: string;
    disabled: boolean;
    error: string | null;
    onChange(ids: string[]): void;
    onSearch(search: string): void;
}

interface SinglePickerStubProps {
    label: string;
    value: string | null;
    selected: PickerOption | null;
    placeholder: string;
    onChange(id: string | null): void;
}

// Stubs of the Task 4 pickers: they expose the props the renderer passes and two buttons.
vi.mock("~/components/picker/WorkflowMultiPicker.js", async () => {
    const react = await import("react");
    return {
        WorkflowMultiPicker: (props: MultiPickerStubProps) => {
            return react.createElement(
                "div",
                {
                    "data-testid": "multi-picker",
                    "data-label": props.label,
                    "data-description": props.description ?? "",
                    "data-required": String(props.required ?? false),
                    "data-values": props.values.join(","),
                    "data-selected": props.selected.map(option => option.id).join(","),
                    "data-options": props.options.map(option => option.id).join(","),
                    "data-placeholder": props.placeholder,
                    "data-disabled": String(props.disabled),
                    "data-error": props.error ?? ""
                },
                react.createElement(
                    "button",
                    { onClick: () => props.onChange(["team-2"]) },
                    "pick team-2"
                ),
                react.createElement("button", { onClick: () => props.onSearch("leg") }, "search")
            );
        }
    };
});

vi.mock("~/components/picker/WorkflowPicker.js", async () => {
    const react = await import("react");
    return {
        WorkflowPicker: (props: SinglePickerStubProps) => {
            return react.createElement(
                "div",
                {
                    "data-testid": "single-picker",
                    "data-label": props.label,
                    "data-value": props.value ?? "",
                    "data-selected": props.selected?.label ?? "",
                    "data-placeholder": props.placeholder
                },
                react.createElement("button", { onClick: () => props.onChange(null) }, "clear")
            );
        }
    };
});

const TEAM_1 = createPickerOption({ id: "team-1", label: "Legal" });
const TEAM_2 = createPickerOption({ id: "team-2", label: "Editors" });

const createPeopleForm = (teams: string[]) => {
    const form = createTestFormModelFactory().create(buildPeopleStepForm());
    form.setData({ teams }, { dirty: false });
    return form;
};

describe("TeamsPickerRenderer (R282, Q42)", () => {
    afterEach(() => {
        cleanup();
    });

    it("passes the label, description, value, options, selected teams and placeholder to the multi picker", () => {
        const form = createPeopleForm(["team-1"]);

        renderStepFormField({
            form,
            name: "teams",
            Renderer: TeamsPickerRenderer,
            options: createStepFormOptions({
                teams: {
                    loading: false,
                    failed: false,
                    retry: vi.fn(),
                    options: [TEAM_1, TEAM_2],
                    selected: [TEAM_1],
                    search: vi.fn()
                }
            })
        });

        const picker = screen.getByTestId("multi-picker");
        expect(picker.getAttribute("data-values")).toBe("team-1");
        expect(picker.getAttribute("data-selected")).toBe("team-1");
        expect(picker.getAttribute("data-options")).toBe("team-1,team-2");
        expect(picker.getAttribute("data-placeholder")).toBe("Search teams");
        expect(picker.getAttribute("data-label")).toBe("Reviewing teams");
        expect(picker.getAttribute("data-description")).toBe(
            "Members of these teams can review. Routing rules can narrow a review to one team or person. Set up who is chosen on the Assignment tab."
        );
        expect(picker.getAttribute("data-required")).toBe("true");
    });

    it("writes the picked ids to the field and forwards a search to the options", () => {
        const form = createPeopleForm(["team-1"]);
        const search = vi.fn();
        renderStepFormField({
            form,
            name: "teams",
            Renderer: TeamsPickerRenderer,
            options: createStepFormOptions({
                teams: {
                    loading: false,
                    failed: false,
                    retry: vi.fn(),
                    options: [TEAM_1, TEAM_2],
                    selected: [TEAM_1],
                    search
                }
            })
        });

        fireEvent.click(screen.getByText("pick team-2"));
        fireEvent.click(screen.getByText("search"));

        expect(form.field("teams").getValue()).toEqual(["team-2"]);
        expect(search).toHaveBeenCalledWith("leg");
    });

    it("shows the validation message through the picker's error", async () => {
        const form = createPeopleForm([]);
        await form.field("teams").validate({ force: true });

        renderStepFormField({ form, name: "teams", Renderer: TeamsPickerRenderer });

        expect(screen.getByTestId("multi-picker").getAttribute("data-error")).toBe(
            "Choose at least one reviewing team."
        );
    });

    it("replaces the picker with the options failure and a Try again button", () => {
        const form = createPeopleForm(["team-1"]);
        const retry = vi.fn();
        renderStepFormField({
            form,
            name: "teams",
            Renderer: TeamsPickerRenderer,
            options: createStepFormOptions({
                teams: {
                    loading: false,
                    failed: true,
                    retry,
                    options: [],
                    selected: [],
                    search: vi.fn()
                }
            })
        });

        expect(screen.queryByTestId("multi-picker")).toBeNull();
        expect(screen.getByText("Reviewing teams")).toBeDefined();
        expect(screen.getByText("Could not load the step options.")).toBeDefined();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(retry).toHaveBeenCalledTimes(1);
    });

    it("renders a clearable single picker for a plain text field (a team setting)", () => {
        const form = createTestFormModelFactory().create({
            fields: registry => {
                return {
                    team: registry.text().label("Team").renderer(STEP_FORM_RENDERER.teams)
                };
            }
        });
        form.setData({ team: "team-2" }, { dirty: false });

        renderStepFormField({
            form,
            name: "team",
            Renderer: TeamsPickerRenderer,
            options: createStepFormOptions({
                teams: {
                    loading: false,
                    failed: false,
                    retry: vi.fn(),
                    options: [TEAM_1, TEAM_2],
                    selected: [],
                    search: vi.fn()
                }
            })
        });

        const picker = screen.getByTestId("single-picker");
        expect(picker.getAttribute("data-value")).toBe("team-2");
        expect(picker.getAttribute("data-selected")).toBe("Editors");
        expect(picker.getAttribute("data-placeholder")).toBe("Search teams");

        fireEvent.click(screen.getByText("clear"));

        expect(form.field("team").getValue()).toBeNull();
    });
});
