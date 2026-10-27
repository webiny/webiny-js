import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import type { JsonSchema } from "@webiny/app-admin/features/formModel/jsonSchema/JsonSchema.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import { createStepFormOptions } from "~/editor/testing/createStepFormOptions.js";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { renderStepFormField } from "~/editor/testing/renderStepFormField.js";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { createReferencesSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createUsersSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { buildAutomationStepForm } from "../buildAutomationStepForm.js";
import { STEP_FORM_RENDERER } from "../stepFormRendererNames.js";
import { UserPickerRenderer } from "./UserPickerRenderer.js";

vi.mock("~/components/picker/WorkflowPicker.js", async () => {
    const stub = await import("~/editor/testing/workflowPickerStub.js");
    return { WorkflowPicker: stub.WorkflowPickerStub };
});

const OWNER_SCHEMA: JsonSchema = {
    type: "object",
    properties: { owner: { type: "string", title: "Owner", ui: "user" } }
};

const IVAN = createWorkflowUserSummary({ id: "user-1", displayName: "Ivan Horvat" });
const ANA = createWorkflowUserSummary({ id: "user-2", displayName: "Ana Kovač" });

const createForm = (owner: string | null) => {
    const definition = createWebhookAutomation({ settingsSchema: OWNER_SCHEMA });
    const form = createTestFormModelFactory().create(buildAutomationStepForm({ definition }));
    form.setData({ settings: { owner } }, { dirty: false });
    return form;
};

const renderOwner = (form: ReturnType<typeof createForm>, users = createUsersSlice()) => {
    renderStepFormField({
        form,
        name: "settings.owner",
        Renderer: UserPickerRenderer,
        options: createStepFormOptions({ users })
    });
};

describe("UserPickerRenderer (R271, R285, R307)", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders the `user` ui hint of an Automation setting", () => {
        const form = createForm(null);

        expect(form.field("settings.owner").vm.renderer).toBe(STEP_FORM_RENDERER.userPicker);
    });

    it("passes the label, the saved value, the users and the Search users placeholder to the picker", () => {
        const form = createForm("user-1");
        renderOwner(form, createUsersSlice({ items: [IVAN, ANA] }));

        const picker = screen.getByTestId("picker-Owner");
        expect(picker.getAttribute("data-label")).toBe("Owner");
        expect(picker.getAttribute("data-value")).toBe("user-1");
        expect(picker.getAttribute("data-selected")).toBe("Ivan Horvat");
        expect(picker.getAttribute("data-options")).toBe("user-1,user-2");
        expect(picker.getAttribute("data-placeholder")).toBe("Search users");
        expect(picker.getAttribute("data-any-label")).toBe("");
    });

    it("writes the picked user id to the setting and null when cleared", () => {
        const form = createForm("user-1");
        renderOwner(form, createUsersSlice({ items: [IVAN, ANA] }));

        fireEvent.click(screen.getByRole("button", { name: "Owner: choose Ana Kovač" }));

        expect(form.field("settings.owner").getValue()).toBe("user-2");

        fireEvent.click(screen.getByRole("button", { name: "Owner: clear" }));

        expect(form.field("settings.owner").getValue()).toBeNull();
    });

    it("shows a saved user that left the system as muted Deleted user", () => {
        const form = createForm("user-9");
        const references = createReferencesSlice({
            users: [createReferenceLabel({ id: "user-9", label: "Deleted user", state: "deleted" })]
        });
        renderStepFormField({
            form,
            name: "settings.owner",
            Renderer: UserPickerRenderer,
            options: createStepFormOptions({ users: createUsersSlice(), references })
        });

        const picker = screen.getByTestId("picker-Owner");
        expect(picker.getAttribute("data-selected")).toBe("Deleted user");
        expect(picker.getAttribute("data-selected-muted")).toBe("true");
    });

    it("shows a server error of the setting under the picker", () => {
        const form = createForm("user-1");
        form.field("settings.owner").setValidation({
            isValid: false,
            message: "The user was deleted."
        });
        renderOwner(form, createUsersSlice({ items: [IVAN] }));

        expect(screen.getByTestId("picker-Owner").getAttribute("data-error")).toBe(
            "The user was deleted."
        );
    });

    it("shows the options failure with Try again", () => {
        const retry = vi.fn();
        const form = createForm(null);
        renderOwner(form, createUsersSlice({ failed: true, retry }));

        expect(screen.getByText("Could not load the step options.")).toBeDefined();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(retry).toHaveBeenCalledTimes(1);
    });
});
