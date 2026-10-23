import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { buildCommonFields } from "./buildCommonFields.js";
import { STEP_FORM_RENDERER } from "./stepFormRendererNames.js";

const createForm = (readOnly = false) => {
    return createTestFormModelFactory().create({
        fields: registry => {
            const common = buildCommonFields({
                registry,
                descriptionPlaceholder: "Describe the step",
                readOnly
            });
            return {
                title: common.title,
                color: common.color,
                description: common.description,
                notifications: common.notifications
            };
        }
    });
};

describe("buildCommonFields (R270, R272, R273)", () => {
    it("labels, placeholders and renderers", () => {
        const form = createForm();

        expect(form.field("title").vm.label).toBe("Title");
        expect(form.field("title").vm.placeholder).toBe("e.g. Legal sign-off");
        expect(form.field("color").vm.label).toBe("Colour");
        expect(form.field("color").vm.renderer).toBe(STEP_FORM_RENDERER.colour);
        expect(form.field("description").vm.label).toBe("Description");
        expect(form.field("description").vm.placeholder).toBe("Describe the step");
        expect(form.field("description").vm.renderer).toBe("textarea");
        expect(form.field("notifications").vm.label).toBe("Notify via");
        expect(form.field("notifications").vm.renderer).toBe(STEP_FORM_RENDERER.transports);
        expect(form.field("notifications").vm.isList).toBe(true);
    });

    it("shows the Notify via hint as the visible description (D96)", () => {
        const form = createForm();

        expect(form.field("notifications").vm.description).toBe(
            "In-app notifications are always sent. Who gets notified is set automatically from the step."
        );
    });

    it("requires a title with the design message (QBZ-12)", async () => {
        const form = createForm();
        const title = form.field("title");

        expect(await title.validate({ force: true })).toBe(false);
        expect(title.vm.validation.message).toBe("Enter a title for this step.");

        title.setValue("Legal sign-off");

        expect(await title.validate({ force: true })).toBe(true);
    });

    it("validates a field after each edit, so errors appear once it was edited (QBZ-13)", async () => {
        const form = createForm();
        const title = form.field("title");

        title.vm.onChange("Legal");
        title.vm.onChange("");

        await vi.waitFor(() => {
            expect(form.field("title").vm.validation.message).toBe("Enter a title for this step.");
        });
    });

    it("flags an unfinished hex colour live and accepts a finished one (R273)", async () => {
        const form = createForm();

        form.field("color").vm.onChange("#3B6");

        await vi.waitFor(() => {
            expect(form.field("color").vm.validation.message).toBe(
                "Enter a hex colour, e.g. #3B6FD4."
            );
        });

        form.field("color").vm.onChange("#3B6FD4");

        await vi.waitFor(() => {
            expect(form.field("color").vm.validation.isValid).toBe(true);
        });
    });

    it("does not block an empty colour or a loaded colour that is not a preset", async () => {
        const form = createForm();
        const color = form.field("color");

        color.setValue("blue");

        expect(await color.validate({ force: true })).toBe(true);
    });

    it("disables every field when read-only", () => {
        const form = createForm(true);

        ["title", "color", "description", "notifications"].forEach(name => {
            expect(form.field(name).vm.disabled).toBe(true);
        });
        expect(createForm(false).field("title").vm.disabled).toBe(false);
    });
});
