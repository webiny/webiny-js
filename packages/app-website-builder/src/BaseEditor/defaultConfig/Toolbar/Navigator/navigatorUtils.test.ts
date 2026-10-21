import { describe, it, expect } from "vitest";
import { getElementNodeData, getGlobalNodeIndexes } from "./navigatorUtils.js";

const HEADER = "$global:Demo/Header";
const FOOTER = "$global:Demo/Footer";

describe("navigatorUtils", () => {
    it("lists globals under the root, in layout order around the page content", () => {
        const globalIndexes = getGlobalNodeIndexes([HEADER, "root", FOOTER]);

        const nodes = getElementNodeData({
            components: {},
            globalIndexes,
            layout: [HEADER, "root", FOOTER],
            elements: {
                root: { type: "Webiny/Element", id: "root", component: { name: "Root" } },
                hero: {
                    type: "Webiny/Element",
                    id: "hero",
                    component: { name: "Hero" },
                    parent: { id: "root", slot: "children" }
                },
                [HEADER]: {
                    type: "Webiny/Element",
                    id: HEADER,
                    component: { name: "Demo/Header" }
                },
                [FOOTER]: { type: "Webiny/Element", id: FOOTER, component: { name: "Demo/Footer" } }
            },
            bindings: {
                root: { inputs: { children: { list: true, static: ["hero"] } } }
            } as any
        });

        expect(nodes[HEADER].nodeParentId).toBe("root");
        expect(nodes[FOOTER].nodeParentId).toBe("root");
        expect(nodes[HEADER].canDrag).toBe(false);

        const order = [HEADER, "hero", FOOTER].sort((a, b) => nodes[a].order! - nodes[b].order!);
        expect(order).toEqual([HEADER, "hero", FOOTER]);
    });

    it("keeps several globals below the page content in layout order", () => {
        const LOWER_FOOTER = "$global:Demo/LowerFooter";
        const indexes = getGlobalNodeIndexes([HEADER, "root", FOOTER, LOWER_FOOTER]);

        const order = [LOWER_FOOTER, FOOTER, HEADER].sort((a, b) => indexes[a] - indexes[b]);
        expect(order).toEqual([HEADER, FOOTER, LOWER_FOOTER]);
    });

    it("doesn't list globals the page's layout doesn't place", () => {
        const DIALOG = "$global:Demo/Dialog";
        const layout = [HEADER, "root"];

        const nodes = getElementNodeData({
            components: {},
            globalIndexes: getGlobalNodeIndexes(layout),
            layout,
            elements: {
                root: { type: "Webiny/Element", id: "root", component: { name: "Root" } },
                [HEADER]: {
                    type: "Webiny/Element",
                    id: HEADER,
                    component: { name: "Demo/Header" }
                },
                [DIALOG]: {
                    type: "Webiny/Element",
                    id: DIALOG,
                    component: { name: "Demo/Dialog" }
                },
                button: {
                    type: "Webiny/Element",
                    id: "button",
                    component: { name: "Button" },
                    parent: { id: DIALOG, slot: "actions" }
                }
            },
            bindings: {} as any
        });

        expect(Object.keys(nodes).sort()).toEqual([HEADER, "root"].sort());
    });

    it("lists a placement of a global under its parent, and not the instance it shows", () => {
        const nodes = getElementNodeData({
            components: {},
            layout: ["root"],
            elements: {
                root: { type: "Webiny/Element", id: "root", component: { name: "Root" } },
                placement: {
                    type: "Webiny/Element",
                    id: "placement",
                    component: { name: "Demo/Header" },
                    parent: { id: "root", slot: "children" }
                },
                [HEADER]: { type: "Webiny/Element", id: HEADER, component: { name: "Demo/Header" } }
            },
            bindings: {
                root: { inputs: { children: { list: true, static: ["placement"] } } }
            } as any
        });

        expect(nodes.placement.parent).toEqual({ id: "root", slot: "children", index: 0 });
        expect(nodes[HEADER]).toBeUndefined();
    });

    it("lists a page's layout under the root, with the page's content where its content areas sit", () => {
        const element = (id: string, name: string, parent?: string, slot = "children") => ({
            type: "Webiny/Element",
            id,
            component: { name },
            ...(parent ? { parent: { id: parent, slot } } : {})
        });

        const nodes = getElementNodeData({
            components: {
                "Demo/Header": { name: "Demo/Header", label: "Site Header" } as any,
                "Demo/Footer": { name: "Demo/Footer", label: "Site Footer" } as any,
                Hero: { name: "Hero", label: "Hero" } as any
            },
            layout: ["root"],
            elements: {
                root: element("root", "Webiny/Root"),
                hero: element("hero", "Hero", "root"),
                footerPlacement: element("footerPlacement", "Demo/Footer", "root"),
                aside: element("aside", "Hero", "root", "sidebar"),
                [HEADER]: element(HEADER, "Demo/Header")
            } as any,
            bindings: {
                root: {
                    inputs: {
                        children: { list: true, static: ["hero", "footerPlacement"] },
                        // The page's content of the named area, stored by the area element's id.
                        sidebar: { list: true, static: ["aside"] }
                    }
                }
            } as any,
            pageLayout: {
                id: "layout",
                elements: {
                    root: element("root", "Webiny/Root"),
                    hdr: element("hdr", "Demo/Header", "root"),
                    content: element("content", "Webiny/LayoutContent", "root"),
                    box: element("box", "Box", "root"),
                    sidebar: element("sidebar", "Webiny/NamedContent", "box"),
                    ftr: element("ftr", "Demo/Footer", "root")
                } as any,
                bindings: {
                    root: {
                        inputs: {
                            children: { list: true, static: ["hdr", "content", "box", "ftr"] }
                        }
                    },
                    box: { inputs: { children: { list: true, static: ["sidebar"] } } },
                    sidebar: { inputs: { area: { static: "sidebar" } } }
                } as any
            }
        });

        // The layout's own elements are listed, its content areas included, but not the global's instance.
        expect(nodes.hdr).toMatchObject({ label: "Site Header", nodeParentId: "root" });
        expect(nodes.content).toMatchObject({
            label: "Main content",
            nodeParentId: "root",
            canDrag: false
        });
        expect(nodes.sidebar).toMatchObject({
            label: "sidebar",
            nodeParentId: "box",
            canDrag: false
        });
        expect(nodes[HEADER]).toBeUndefined();

        const childrenOf = (parentId: string) =>
            Object.values(nodes)
                .filter(node => node.nodeParentId === parentId)
                .sort((a, b) => a.order! - b.order!)
                .map(node => node.id);
        expect(childrenOf("root")).toEqual(["hdr", "content", "box", "ftr"]);

        // The page's content is listed under its content area.
        expect(childrenOf("content")).toEqual(["hero", "footerPlacement"]);
        expect(childrenOf("sidebar")).toEqual(["aside"]);
        expect(nodes.aside.parent).toEqual({ id: "root", slot: "sidebar", index: 0 });

        // The page's own elements move within the page; the layout's don't move from the page.
        expect(nodes.hero).toMatchObject({
            canDrag: true,
            parent: { id: "root", slot: "children", index: 0 }
        });
        expect(nodes.footerPlacement.canDrag).toBe(true);
        expect(nodes.hdr.canDrag).toBe(false);
        expect(nodes.hdr.parent?.slot).toBe("");
    });
});
