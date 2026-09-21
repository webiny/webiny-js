import { describe, expect, it } from "vitest";
import { createTextInput } from "@webiny/website-builder-sdk";
import type { ComponentManifest } from "@webiny/website-builder-sdk";
import { buildPageDocument } from "./buildPageDocument.js";

const manifest = (name: string): ComponentManifest =>
    ({
        name,
        inputs: [createTextInput({ name: "title", label: "Title" })],
        tags: []
    }) as ComponentManifest;

describe("buildPageDocument", () => {
    it("keeps the root element and hangs the components off it", () => {
        const { elements } = buildPageDocument({
            path: "/pricing",
            title: "Pricing",
            placements: [{ manifest: manifest("Custom/Hero"), inputs: { title: "Plans" } }]
        });

        expect(elements.root?.component.name).toBe("Webiny/Root");

        const children = Object.values(elements).filter(element => element.id !== "root");
        expect(children).toHaveLength(1);
        expect(children[0]?.component.name).toBe("Custom/Hero");
        expect(children[0]?.parent).toEqual({ id: "root", slot: "children" });
    });

    it("records document order in the root's children binding, not the elements map", () => {
        const { elements, bindings } = buildPageDocument({
            path: "/",
            title: "Home",
            placements: [
                { manifest: manifest("Custom/Header"), inputs: { title: "Meridian" } },
                { manifest: manifest("Custom/Hero"), inputs: { title: "Build faster" } },
                { manifest: manifest("Custom/Footer"), inputs: { title: "© Meridian" } }
            ]
        });

        const order = bindings.root?.inputs?.children?.static as string[];
        expect(order).toHaveLength(3);
        expect(order.map(id => elements[id]?.component.name)).toEqual([
            "Custom/Header",
            "Custom/Hero",
            "Custom/Footer"
        ]);
    });

    it("binds each instance's own input values", () => {
        const { elements, bindings } = buildPageDocument({
            path: "/",
            title: "Home",
            placements: [
                { manifest: manifest("Custom/Hero"), inputs: { title: "Build faster" } },
                { manifest: manifest("Custom/Hero"), inputs: { title: "Scale up" } }
            ]
        });

        const heroIds = Object.values(elements)
            .filter(element => element.component.name === "Custom/Hero")
            .map(element => element.id);

        const titles = heroIds.map(id => bindings[id]?.inputs?.title?.static);
        expect(titles).toEqual(["Build faster", "Scale up"]);
    });

    it("registers a component used twice only once", () => {
        const { elements } = buildPageDocument({
            path: "/",
            title: "Home",
            placements: [
                { manifest: manifest("Custom/Hero"), inputs: { title: "One" } },
                { manifest: manifest("Custom/Hero"), inputs: { title: "Two" } }
            ]
        });

        expect(Object.keys(elements)).toHaveLength(3);
    });
});
