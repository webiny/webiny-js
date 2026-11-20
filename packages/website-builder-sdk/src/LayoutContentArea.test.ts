import { describe, it, expect } from "vitest";
import { LayoutContentArea } from "./LayoutContentArea.js";

const element = (id: string, name: string, parentId?: string) => ({
    type: "Webiny/Element" as const,
    id,
    component: { name },
    parent: parentId ? { id: parentId, slot: "children" } : undefined
});

const document = {
    elements: {
        root: element("root", "Webiny/Root"),
        main: element("main", "Webiny/LayoutContent", "root"),
        aside: element("aside", "Webiny/Box", "root"),
        sidebar: element("sidebar", "Webiny/NamedContent", "aside"),
        unnamed: element("unnamed", "Webiny/NamedContent", "aside")
    },
    bindings: {
        main: { inputs: { area: { id: "m", type: "text", static: "ignored" } } },
        sidebar: { inputs: { area: { id: "a", type: "text", static: " sidebar " } } }
    }
};

const area = (doc: typeof document, id: string) => LayoutContentArea.from(doc, id)!;

describe("page content areas", () => {
    it("names main content main, and a named area by its input", () => {
        expect(area(document, "main").name()).toBe(LayoutContentArea.MAIN);
        expect(area(document, "main").isMain()).toBe(true);
        expect(area(document, "sidebar").name()).toBe("sidebar");
        expect(area(document, "sidebar").isMain()).toBe(false);
        expect(area(document, "unnamed").name()).toBeNull();
    });

    it("is no area for other elements", () => {
        expect(LayoutContentArea.from(document, "aside")).toBeNull();
        expect(LayoutContentArea.from(document, "missing")).toBeNull();
    });

    it("tells content area components from others", () => {
        expect(LayoutContentArea.is("Webiny/LayoutContent")).toBe(true);
        expect(LayoutContentArea.is("Webiny/NamedContent")).toBe(true);
        expect(LayoutContentArea.is("Webiny/Box")).toBe(false);
    });

    it("lists a layout's areas", () => {
        expect(LayoutContentArea.allIn(document).map(a => a.name())).toEqual([
            "main",
            "sidebar",
            null
        ]);
    });

    it("keeps the main area's content in the page root's children, and others in slots of their own", () => {
        expect(area(document, "main").slot()).toBe("children");
        expect(area(document, "sidebar").slot()).toBe("sidebar");
        expect(area(document, "unnamed").slot()).toBe("unnamed");
    });

    it("stores a named area's content by the area's id, not by its name", () => {
        const renamed = {
            ...document,
            bindings: {
                ...document.bindings,
                sidebar: { inputs: { area: { id: "a", type: "text", static: "Left column" } } }
            }
        };
        expect(area(renamed, "sidebar").name()).toBe("Left column");
        expect(area(renamed, "sidebar").slot()).toBe("sidebar");
    });

    it("reads a rendered area's name from its input", () => {
        const named = LayoutContentArea.fromElement(document.elements.sidebar, " Left column ");
        expect(named.name()).toBe("Left column");
        expect(named.slot()).toBe("sidebar");
        expect(LayoutContentArea.fromElement(document.elements.main, "ignored").name()).toBe(
            LayoutContentArea.MAIN
        );
    });

    it("checks drops into an area's slot against the page root's children input", () => {
        expect(LayoutContentArea.slotInputPath("root", area(document, "sidebar").slot())).toBe(
            "children"
        );
        expect(LayoutContentArea.slotInputPath("root", "children")).toBe("children");
        expect(LayoutContentArea.slotInputPath("grid", "columns.0.children")).toBe(
            "columns.0.children"
        );
    });

    it("tells elements holding an area from those holding the main one", () => {
        expect(LayoutContentArea.anyWithin(document, "aside")).toBe(true);
        expect(LayoutContentArea.mainWithin(document, "aside")).toBe(false);
        expect(LayoutContentArea.mainWithin(document, "root")).toBe(true);
        expect(LayoutContentArea.mainWithin(document, "main")).toBe(true);
    });
});
