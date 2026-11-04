import { describe, it, expect } from "vitest";
import { ElementSelection } from "./ElementSelection.js";

const element = (id: string, parentId?: string) => ({
    type: "Webiny/Element" as const,
    id,
    component: { name: "Any" },
    parent: parentId ? { id: parentId, slot: "children" } : undefined
});

const document = {
    elements: {
        "$global:Demo/LoginDialog": element("$global:Demo/LoginDialog"),
        field: element("field", "$global:Demo/LoginDialog"),
        label: element("label", "field"),
        root: element("root"),
        hero: element("hero", "root")
    }
};

describe("ElementSelection", () => {
    it("selects nothing until the editor says so", () => {
        const selection = new ElementSelection();

        expect(selection.getSelectedId()).toBeNull();
        expect(selection.isSelected("$global:Demo/LoginDialog", document)).toBe(false);
    });

    it("is selected when the element itself is selected", () => {
        const selection = new ElementSelection();
        selection.select("$global:Demo/LoginDialog");

        expect(selection.isSelected("$global:Demo/LoginDialog", document)).toBe(true);
        expect(selection.isSelected("root", document)).toBe(false);
    });

    it("is selected when an element inside it is selected, at any depth", () => {
        const selection = new ElementSelection();
        selection.select("label");

        expect(selection.isSelected("$global:Demo/LoginDialog", document)).toBe(true);
        expect(selection.isSelected("field", document)).toBe(true);
        expect(selection.isSelected("hero", document)).toBe(false);
    });

    it("is not selected for an element inside it", () => {
        const selection = new ElementSelection();
        selection.select("field");

        expect(selection.isSelected("label", document)).toBe(false);
    });

    it("is not selected after deselecting", () => {
        const selection = new ElementSelection();
        selection.select("$global:Demo/LoginDialog");
        selection.deselect();

        expect(selection.isSelected("$global:Demo/LoginDialog", document)).toBe(false);
    });

    it("only matches the element itself without a document", () => {
        const selection = new ElementSelection();
        selection.select("label");

        expect(selection.isSelected("label", null)).toBe(true);
        expect(selection.isSelected("field", null)).toBe(false);
    });

    it("stops at a parent cycle", () => {
        const selection = new ElementSelection();
        selection.select("a");
        const cyclic = { elements: { a: element("a", "b"), b: element("b", "a") } };

        expect(selection.isSelected("b", cyclic)).toBe(true);
        expect(selection.isSelected("hero", cyclic)).toBe(false);
    });
});
