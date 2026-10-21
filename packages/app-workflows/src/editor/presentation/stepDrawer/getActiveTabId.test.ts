import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { getActiveTabId } from "./getActiveTabId.js";

const createTabbedForm = () => {
    return createTestFormModelFactory().create({
        fields: registry => {
            return {
                title: registry.text().label("Title"),
                note: registry.text().label("Note")
            };
        },
        layout: layout => [
            layout
                .tabs("tabs")
                .tab("general", tab => {
                    tab.label("General").layout(inner => [inner.row("title")]);
                })
                .tab("assignment", tab => {
                    tab.label("Assignment").layout(inner => [inner.row("note")]);
                })
        ]
    });
};

describe("getActiveTabId", () => {
    it("is null with no form", () => {
        expect(getActiveTabId(null)).toBeNull();
    });

    it("is null for a form without tabs", () => {
        const form = createTestFormModelFactory().create({
            fields: registry => {
                return { title: registry.text().label("Title") };
            }
        });

        expect(getActiveTabId(form.vm)).toBeNull();
    });

    it("is the first tab of a fresh form", () => {
        const form = createTabbedForm();

        expect(getActiveTabId(form.vm)).toBe("general");
    });

    it("follows the tab the form activates", () => {
        const form = createTabbedForm();

        form.focusField("note");

        expect(getActiveTabId(form.vm)).toBe("assignment");
    });
});
