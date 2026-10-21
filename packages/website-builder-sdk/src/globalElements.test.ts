import { describe, it, expect } from "vitest";
import type { ComponentManifest, GlobalDocument } from "~/types.js";
import {
    getGlobalRootId,
    GlobalElementId,
    isGlobalElement,
    pickGlobalElement,
    splitGlobalDocument
} from "./globalElements.js";
import { withGlobalElementDefaults } from "./withGlobalElementDefaults.js";
import { createComponent } from "./createComponent.js";
import { createTextInput } from "./createInput.js";
import { createElement } from "./createElement.js";

const header: ComponentManifest = {
    name: "Demo/Header",
    global: true,
    tags: [],
    inputs: [{ type: "text", renderer: "Webiny/Input", name: "title", defaultValue: "Welcome" }]
};

const banner: ComponentManifest = {
    name: "Demo/Banner",
    tags: [],
    inputs: [{ type: "text", renderer: "Webiny/Input", name: "headline" }]
};

const components = { [header.name]: header, [banner.name]: banner };

const element = (id: string, parentId?: string) => ({
    type: "Webiny/Element" as const,
    id,
    component: { name: "Any" },
    parent: parentId ? { id: parentId, slot: "children" } : undefined
});

describe("global elements", () => {
    it("uses a fixed id per global component", () => {
        expect(GlobalElementId.fromName("Demo/Header").toString()).toBe("$global:Demo/Header");
        expect(GlobalElementId.fromId("$global:Demo/Header")?.name).toBe("Demo/Header");
        expect(GlobalElementId.fromId("Demo/Header")).toBeNull();
    });

    it("treats elements nested inside a global as global", () => {
        const elements = {
            root: element("root"),
            "$global:Demo/Header": element("$global:Demo/Header"),
            child: element("child", "$global:Demo/Header"),
            grandChild: element("grandChild", "child"),
            pageElement: element("pageElement", "root")
        };

        expect(isGlobalElement(elements, "$global:Demo/Header")).toBe(true);
        expect(isGlobalElement(elements, "child")).toBe(true);
        expect(isGlobalElement(elements, "grandChild")).toBe(true);
        expect(isGlobalElement(elements, "pageElement")).toBe(false);
        expect(isGlobalElement(elements, "root")).toBe(false);
    });

    it("tells placements of a global apart from its instance", () => {
        const placement = { id: "abc", component: { name: "Demo/Header" } };
        const instance = { id: "$global:Demo/Header", component: { name: "Demo/Header" } };
        const other = { id: "def", component: { name: "Demo/Banner" } };

        expect(GlobalElementId.isPlacement(placement, components)).toBe(true);
        expect(GlobalElementId.isPlacement(instance, components)).toBe(false);
        expect(GlobalElementId.isPlacement(other, components)).toBe(false);

        expect(GlobalElementId.bindingsIdOf(placement, components)).toBe("$global:Demo/Header");
        expect(GlobalElementId.bindingsIdOf(other, components)).toBe("def");
    });

    it("splits a merged document into page and globals parts", () => {
        const document: GlobalDocument = {
            elements: {
                root: element("root"),
                "$global:Demo/Header": element("$global:Demo/Header"),
                child: element("child", "$global:Demo/Header")
            },
            bindings: {
                root: { inputs: {} },
                "$global:Demo/Header": { inputs: {} },
                child: { inputs: {} }
            }
        };

        const { page, globals } = splitGlobalDocument(document);

        expect(Object.keys(page.elements)).toEqual(["root"]);
        expect(Object.keys(page.bindings)).toEqual(["root"]);
        expect(Object.keys(globals.elements)).toEqual(["$global:Demo/Header", "child"]);
        expect(Object.keys(globals.bindings)).toEqual(["$global:Demo/Header", "child"]);
    });

    it("picks one global with everything inside it", () => {
        const document: GlobalDocument = {
            elements: {
                root: element("root"),
                "$global:Demo/Header": element("$global:Demo/Header"),
                child: element("child", "$global:Demo/Header"),
                "$global:Demo/Footer": element("$global:Demo/Footer")
            },
            bindings: {
                root: { inputs: {} },
                "$global:Demo/Header": { inputs: {} },
                child: { inputs: {} },
                "$global:Demo/Footer": { inputs: {} }
            }
        };

        expect(getGlobalRootId(document.elements, "child")).toBe("$global:Demo/Header");
        expect(getGlobalRootId(document.elements, "root")).toBe(null);

        const header = pickGlobalElement(document, "$global:Demo/Header");
        expect(Object.keys(header.elements)).toEqual(["$global:Demo/Header", "child"]);
        expect(Object.keys(header.bindings)).toEqual(["$global:Demo/Header", "child"]);
    });

    it("adds default instances only for globals without a stored instance", () => {
        const empty = withGlobalElementDefaults({ elements: {}, bindings: {} }, components);

        expect(Object.keys(empty.elements)).toEqual(["$global:Demo/Header"]);
        expect(empty.elements["$global:Demo/Header"]).toEqual({
            type: "Webiny/Element",
            id: "$global:Demo/Header",
            component: { name: "Demo/Header" }
        });
        expect(empty.bindings["$global:Demo/Header"].inputs?.title?.static).toBe("Welcome");

        const stored = {
            elements: { "$global:Demo/Header": element("$global:Demo/Header") },
            bindings: { "$global:Demo/Header": { inputs: {} } }
        };
        expect(withGlobalElementDefaults(stored, components)).toBe(stored);
    });

    it("builds the same ids every time for a default instance with slot children", () => {
        const footer: ComponentManifest = {
            name: "Demo/Footer",
            global: true,
            tags: [],
            inputs: [{ type: "slot", list: true, renderer: "Webiny/Slot", name: "links" }],
            defaults: {
                inputs: { links: [createElement({ component: banner.name })] }
            }
        };
        const withFooter = { ...components, [footer.name]: footer };

        const first = withGlobalElementDefaults({ elements: {}, bindings: {} }, withFooter);
        const second = withGlobalElementDefaults({ elements: {}, bindings: {} }, withFooter);

        const childIds = Object.keys(first.elements).filter(id => !GlobalElementId.isGlobal(id));
        expect(childIds).toHaveLength(1);
        expect(first.elements[childIds[0]].parent?.id).toBe("$global:Demo/Footer");
        expect(second).toEqual(first);
    });

    it("keeps default ids apart for globals whose names differ only in punctuation", () => {
        const slotGlobal = (name: string): ComponentManifest => ({
            name,
            global: true,
            tags: [],
            inputs: [{ type: "slot", list: true, renderer: "Webiny/Slot", name: "links" }],
            defaults: {
                inputs: { links: [createElement({ component: banner.name })] }
            }
        });
        const names = ["Demo/Header", "Demo-Header", "Demo Header", "Demo_Header"];
        const manifests = Object.fromEntries(names.map(name => [name, slotGlobal(name)]));

        const document = withGlobalElementDefaults(
            { elements: {}, bindings: {} },
            { ...manifests, [banner.name]: banner }
        );

        const childIds = Object.keys(document.elements).filter(id => !GlobalElementId.isGlobal(id));
        expect(childIds).toHaveLength(names.length);
        expect(childIds.map(id => document.elements[id].parent?.id).sort()).toEqual(
            names.map(name => `$global:${name}`).sort()
        );
    });

    it("keeps overrides of a global without a stored instance on top of its defaults", () => {
        const document = withGlobalElementDefaults(
            {
                elements: {},
                bindings: {
                    "$global:Demo/Header": {
                        inputs: { title: { id: "x", type: "text", static: "Overridden" } }
                    }
                }
            },
            components
        );

        expect(document.elements["$global:Demo/Header"]).toBeDefined();
        expect(document.bindings["$global:Demo/Header"].inputs?.title?.static).toBe("Overridden");
    });

    it("keeps the default styles of a global without a stored instance when one of its inputs is overridden", () => {
        const id = "$global:Demo/Header";
        const styled = {
            ...components,
            [header.name]: {
                ...header,
                defaults: {
                    styles: { color: "red" },
                    overrides: { mobile: { styles: { color: "blue" } } }
                }
            }
        };
        const defaults = withGlobalElementDefaults({ elements: {}, bindings: {} }, styled);
        const document = withGlobalElementDefaults(
            {
                elements: {},
                bindings: {
                    [id]: {
                        inputs: { title: { id: "x", type: "text", static: "Overridden" } },
                        styles: {},
                        overrides: {}
                    }
                }
            },
            styled
        );

        expect(defaults.bindings[id].styles?.color).toEqual({ static: "red" });
        expect(document.bindings[id].inputs?.title?.static).toBe("Overridden");
        expect(document.bindings[id].styles).toEqual(defaults.bindings[id].styles);
        expect(document.bindings[id].overrides).toEqual(defaults.bindings[id].overrides);
    });

    it("keeps the global flag on the manifest", () => {
        const Header = (_props: { inputs: { title: string } }) => null;
        const { manifest } = createComponent(Header, {
            name: "Demo/Header",
            global: true,
            inputs: [createTextInput({ name: "title" })]
        });

        expect(manifest.global).toBe(true);
    });
});
