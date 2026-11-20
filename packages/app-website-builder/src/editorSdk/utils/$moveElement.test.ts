import { describe, it, expect } from "vitest";
import type { ComponentManifest, Document } from "@webiny/website-builder-sdk";
import { $moveElement } from "./$moveElement.js";

const HEADER = "$global:Demo/Header";

const element = (id: string, name: string, parentId?: string) => {
    return {
        type: "Webiny/Element",
        id,
        component: { name },
        parent: parentId ? { id: parentId, slot: "children" } : undefined
    };
};

const components = {
    "Demo/Header": { name: "Demo/Header", global: true, tags: [] },
    "Demo/Footer": { name: "Demo/Footer", global: true, tags: [] },
    "Webiny/Box": { name: "Webiny/Box", tags: [] }
} as unknown as Record<string, ComponentManifest>;

// A page: the header's instance (no parent) with a box inside it, a placement of the footer, and a section
// holding another footer placement.
const createDocument = () => {
    return {
        elements: {
            root: element("root", "Webiny/Root"),
            [HEADER]: element(HEADER, "Demo/Header"),
            box: element("box", "Webiny/Box", HEADER),
            footer: element("footer", "Demo/Footer", "root"),
            section: element("section", "Webiny/Box", "root"),
            nestedFooter: element("nestedFooter", "Demo/Footer", "section")
        },
        bindings: {
            root: {
                inputs: {
                    children: { type: "slot", list: true, static: ["footer", "section"] }
                }
            },
            [HEADER]: { inputs: { children: { type: "slot", list: true, static: ["box"] } } },
            box: { inputs: { children: { type: "slot", list: true, static: [] } } },
            section: {
                inputs: { children: { type: "slot", list: true, static: ["nestedFooter"] } }
            }
        }
    } as unknown as Document;
};

describe("$moveElement", () => {
    it.each([
        ["a placement of a global", "footer"],
        ["an element holding a placement of a global", "section"]
    ])("doesn't move %s inside a global", (_, elementId) => {
        const document = createDocument();

        const result = $moveElement(document, {
            elementId,
            parentId: "box",
            slot: "children",
            index: 0,
            components
        });

        expect(result).toEqual({
            allowed: false,
            violation: {
                message: "A global component can't be placed inside another global component."
            }
        });
        expect(document).toEqual(createDocument());
    });

    it.each([
        ["onto the page", "root"],
        ["into another element of the page", "section"]
    ])("doesn't move an element of a global out of it, %s", (_, parentId) => {
        const document = createDocument();

        const result = $moveElement(document, {
            elementId: "box",
            parentId,
            slot: "children",
            index: 0,
            components
        });

        expect(result).toEqual({
            allowed: false,
            violation: { message: "Elements of a global component can't be moved out of it." }
        });
        expect(document).toEqual(createDocument());
    });

    it("doesn't move a global's instance: its placements are moved", () => {
        const document = createDocument();

        const result = $moveElement(document, {
            elementId: HEADER,
            parentId: "root",
            slot: "children",
            index: 0,
            components
        });

        expect(result?.allowed).toBe(false);
        expect(document).toEqual(createDocument());
    });
});
