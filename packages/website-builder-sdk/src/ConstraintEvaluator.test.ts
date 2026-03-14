import { describe, it, expect } from "vitest";
import { evaluateConstraints } from "./ConstraintEvaluator.js";
import type { ComponentManifest, Document, DocumentElement, ConstraintContext } from "~/types.js";

function makeElement(
    id: string,
    componentName: string,
    parent?: { id: string; slot: string }
): DocumentElement {
    return {
        type: "Webiny/Element",
        id,
        component: { name: componentName },
        parent
    };
}

function makeManifest(name: string, overrides?: Partial<ComponentManifest>): ComponentManifest {
    return { name, inputs: [], ...overrides };
}

function makeDocument(elements: DocumentElement[], bindings: Document["bindings"] = {}): Document {
    const elementMap: Record<string, DocumentElement> = {};
    for (const el of elements) {
        elementMap[el.id] = el;
    }
    return {
        id: "doc-1",
        state: {},
        version: 1,
        properties: {},
        metadata: {},
        bindings,
        elements: elementMap
    };
}

describe("evaluateConstraints", () => {
    it("should allow placement when there are no constraints", () => {
        const parent = makeElement("parent-1", "Container");
        const doc = makeDocument([parent]);
        const components: Record<string, ComponentManifest> = {
            Container: makeManifest("Container"),
            Button: makeManifest("Button")
        };

        const result = evaluateConstraints({
            componentName: "Button",
            parentId: "parent-1",
            slot: "children",
            document: doc,
            components
        });

        expect(result.allowed).toBe(true);
        expect(result.violation).toBeUndefined();
    });

    it("should block when component's parent constraint fails", () => {
        const parent = makeElement("parent-1", "Container");
        const doc = makeDocument([parent]);
        const components: Record<string, ComponentManifest> = {
            Container: makeManifest("Container"),
            TabPanel: makeManifest("TabPanel", {
                constraints: [
                    {
                        check: (ctx: ConstraintContext) => ctx.parent.manifest.name === "Tabs",
                        message: "TabPanel must be inside Tabs"
                    }
                ]
            })
        };

        const result = evaluateConstraints({
            componentName: "TabPanel",
            parentId: "parent-1",
            slot: "children",
            document: doc,
            components
        });

        expect(result.allowed).toBe(false);
        expect(result.violation).toBeDefined();
        expect(result.violation!.message).toBe("TabPanel must be inside Tabs");
    });

    it("should allow when parent constraint passes", () => {
        const parent = makeElement("parent-1", "Tabs");
        const doc = makeDocument([parent]);
        const components: Record<string, ComponentManifest> = {
            Tabs: makeManifest("Tabs"),
            TabPanel: makeManifest("TabPanel", {
                constraints: [
                    {
                        check: (ctx: ConstraintContext) => ctx.parent.manifest.name === "Tabs",
                        message: "TabPanel must be inside Tabs"
                    }
                ]
            })
        };

        const result = evaluateConstraints({
            componentName: "TabPanel",
            parentId: "parent-1",
            slot: "children",
            document: doc,
            components
        });

        expect(result.allowed).toBe(true);
        expect(result.violation).toBeUndefined();
    });

    it("should block when ancestor constraint fails", () => {
        const root = makeElement("root", "Page");
        const section = makeElement("section-1", "Section", { id: "root", slot: "children" });
        const doc = makeDocument([root, section]);
        const components: Record<string, ComponentManifest> = {
            Page: makeManifest("Page"),
            Section: makeManifest("Section"),
            ProductPrice: makeManifest("ProductPrice", {
                constraints: [
                    {
                        check: (ctx: ConstraintContext) =>
                            ctx.ancestors.some(a => a.manifest.name === "ProductBox"),
                        message: "ProductPrice must be inside a ProductBox"
                    }
                ]
            })
        };

        const result = evaluateConstraints({
            componentName: "ProductPrice",
            parentId: "section-1",
            slot: "children",
            document: doc,
            components
        });

        expect(result.allowed).toBe(false);
        expect(result.violation!.message).toBe("ProductPrice must be inside a ProductBox");
    });

    it("should allow when grandparent matches ancestor constraint", () => {
        const root = makeElement("root", "ProductBox");
        const inner = makeElement("inner-1", "Container", { id: "root", slot: "children" });
        const doc = makeDocument([root, inner]);
        const components: Record<string, ComponentManifest> = {
            ProductBox: makeManifest("ProductBox"),
            Container: makeManifest("Container"),
            ProductPrice: makeManifest("ProductPrice", {
                constraints: [
                    {
                        check: (ctx: ConstraintContext) =>
                            ctx.ancestors.some(a => a.manifest.name === "ProductBox"),
                        message: "ProductPrice must be inside a ProductBox"
                    }
                ]
            })
        };

        const result = evaluateConstraints({
            componentName: "ProductPrice",
            parentId: "inner-1",
            slot: "children",
            document: doc,
            components
        });

        expect(result.allowed).toBe(true);
    });

    it("should block via slot children limit constraint using inputs", () => {
        const parent = makeElement("parent-1", "Grid");
        const child1 = makeElement("child-1", "Cell", { id: "parent-1", slot: "children" });
        const child2 = makeElement("child-2", "Cell", { id: "parent-1", slot: "children" });
        const doc = makeDocument([parent, child1, child2], {
            "parent-1": {
                inputs: {
                    children: {
                        id: "inp-1",
                        type: "slot",
                        static: ["child-1", "child-2"]
                    }
                }
            }
        });

        const components: Record<string, ComponentManifest> = {
            Grid: makeManifest("Grid"),
            Cell: makeManifest("Cell", {
                constraints: [
                    {
                        check: (ctx: ConstraintContext) => {
                            const items = ctx.parent.inputs[ctx.slot]?.static ?? [];
                            return Array.isArray(items) ? items.length < 2 : true;
                        },
                        message: "Maximum 2 children allowed"
                    }
                ]
            })
        };

        const result = evaluateConstraints({
            componentName: "Cell",
            parentId: "parent-1",
            slot: "children",
            document: doc,
            components
        });

        expect(result.allowed).toBe(false);
        expect(result.violation!.message).toBe("Maximum 2 children allowed");
    });

    it("should block via countInstances when max instances reached", () => {
        const root = makeElement("root", "Page");
        const hero = makeElement("hero-1", "Hero", { id: "root", slot: "children" });
        const doc = makeDocument([root, hero]);

        const components: Record<string, ComponentManifest> = {
            Page: makeManifest("Page"),
            Hero: makeManifest("Hero", {
                constraints: [
                    {
                        check: (ctx: ConstraintContext) => ctx.document.countInstances("Hero") < 1,
                        message: "Only one Hero per page"
                    }
                ]
            })
        };

        const result = evaluateConstraints({
            componentName: "Hero",
            parentId: "root",
            slot: "children",
            document: doc,
            components
        });

        expect(result.allowed).toBe(false);
        expect(result.violation!.message).toBe("Only one Hero per page");
    });

    it("should not evaluate parent's constraints against the placed component", () => {
        const parent = makeElement("parent-1", "Tabs");
        const doc = makeDocument([parent]);

        const components: Record<string, ComponentManifest> = {
            Tabs: makeManifest("Tabs", {
                constraints: [
                    {
                        check: () => false,
                        message: "This should not run for children"
                    }
                ]
            }),
            Button: makeManifest("Button")
        };

        // Parent's constraints should not affect children being dropped into it
        const result = evaluateConstraints({
            componentName: "Button",
            parentId: "parent-1",
            slot: "children",
            document: doc,
            components
        });
        expect(result.allowed).toBe(true);
    });

    it("should short-circuit on the first failed constraint", () => {
        const parent = makeElement("parent-1", "Container");
        const doc = makeDocument([parent]);

        const components: Record<string, ComponentManifest> = {
            Container: makeManifest("Container"),
            Widget: makeManifest("Widget", {
                constraints: [
                    {
                        check: () => true,
                        message: "Always passes"
                    },
                    {
                        check: () => false,
                        message: "Always fails"
                    },
                    {
                        check: () => false,
                        message: "Also fails"
                    }
                ]
            })
        };

        const result = evaluateConstraints({
            componentName: "Widget",
            parentId: "parent-1",
            slot: "children",
            document: doc,
            components
        });

        expect(result.allowed).toBe(false);
        expect(result.violation!.message).toBe("Always fails");
    });

    it("should allow placement when component manifest is not found", () => {
        const parent = makeElement("parent-1", "Container");
        const doc = makeDocument([parent]);

        const components: Record<string, ComponentManifest> = {
            Container: makeManifest("Container")
        };

        const result = evaluateConstraints({
            componentName: "Unknown",
            parentId: "parent-1",
            slot: "children",
            document: doc,
            components
        });

        expect(result.allowed).toBe(true);
    });

    it("should allow placement when parent element is not found", () => {
        const doc = makeDocument([]);

        const components: Record<string, ComponentManifest> = {
            Button: makeManifest("Button")
        };

        const result = evaluateConstraints({
            componentName: "Button",
            parentId: "nonexistent",
            slot: "children",
            document: doc,
            components
        });

        expect(result.allowed).toBe(true);
    });

    it("should handle multi-slot parent constraint checking specific slot", () => {
        const parent = makeElement("parent-1", "TwoColumn");
        const child = makeElement("child-1", "Widget", {
            id: "parent-1",
            slot: "leftColumn"
        });
        const doc = makeDocument([parent, child], {
            "parent-1": {
                inputs: {
                    leftColumn: {
                        id: "inp-left",
                        type: "slot",
                        static: ["child-1"]
                    },
                    rightColumn: {
                        id: "inp-right",
                        type: "slot",
                        static: []
                    }
                }
            }
        });

        const components: Record<string, ComponentManifest> = {
            TwoColumn: makeManifest("TwoColumn"),
            Widget: makeManifest("Widget", {
                constraints: [
                    {
                        check: (ctx: ConstraintContext) => {
                            const items = ctx.parent.inputs[ctx.slot]?.static ?? [];
                            return Array.isArray(items) ? items.length < 1 : true;
                        },
                        message: "Slot is full"
                    }
                ]
            })
        };

        // leftColumn is full
        const leftResult = evaluateConstraints({
            componentName: "Widget",
            parentId: "parent-1",
            slot: "leftColumn",
            document: doc,
            components
        });
        expect(leftResult.allowed).toBe(false);

        // rightColumn is empty
        const rightResult = evaluateConstraints({
            componentName: "Widget",
            parentId: "parent-1",
            slot: "rightColumn",
            document: doc,
            components
        });
        expect(rightResult.allowed).toBe(true);
    });

    it("should provide a default message when constraint has no message", () => {
        const parent = makeElement("parent-1", "Container");
        const doc = makeDocument([parent]);

        const components: Record<string, ComponentManifest> = {
            Container: makeManifest("Container"),
            Widget: makeManifest("Widget", {
                constraints: [{ check: () => false }]
            })
        };

        const result = evaluateConstraints({
            componentName: "Widget",
            parentId: "parent-1",
            slot: "children",
            document: doc,
            components
        });

        expect(result.violation!.message).toBe("Cannot place Widget here");
    });

    it("should use thrown error message as the violation message", () => {
        const parent = makeElement("parent-1", "Container");
        const doc = makeDocument([parent]);

        const components: Record<string, ComponentManifest> = {
            Container: makeManifest("Container"),
            Widget: makeManifest("Widget", {
                constraints: [
                    {
                        check: (ctx: ConstraintContext) => {
                            throw new Error(
                                `Widget cannot be placed inside ${ctx.parent.manifest.name}`
                            );
                        }
                    }
                ]
            })
        };

        const result = evaluateConstraints({
            componentName: "Widget",
            parentId: "parent-1",
            slot: "children",
            document: doc,
            components
        });

        expect(result.allowed).toBe(false);
        expect(result.violation!.message).toBe("Widget cannot be placed inside Container");
    });

    it("should fall back to static message when a non-Error is thrown", () => {
        const parent = makeElement("parent-1", "Container");
        const doc = makeDocument([parent]);

        const components: Record<string, ComponentManifest> = {
            Container: makeManifest("Container"),
            Widget: makeManifest("Widget", {
                constraints: [
                    {
                        check: () => {
                            throw "not an error object";
                        },
                        message: "Static fallback"
                    }
                ]
            })
        };

        const result = evaluateConstraints({
            componentName: "Widget",
            parentId: "parent-1",
            slot: "children",
            document: doc,
            components
        });

        expect(result.allowed).toBe(false);
        expect(result.violation!.message).toBe("Static fallback");
    });

    it("should fall back to default message when a non-Error is thrown and no static message", () => {
        const parent = makeElement("parent-1", "Container");
        const doc = makeDocument([parent]);

        const components: Record<string, ComponentManifest> = {
            Container: makeManifest("Container"),
            Widget: makeManifest("Widget", {
                constraints: [
                    {
                        check: () => {
                            throw null;
                        }
                    }
                ]
            })
        };

        const result = evaluateConstraints({
            componentName: "Widget",
            parentId: "parent-1",
            slot: "children",
            document: doc,
            components
        });

        expect(result.allowed).toBe(false);
        expect(result.violation!.message).toBe("Cannot place Widget here");
    });

    describe("ctx.isChildOf", () => {
        it("should return true when direct parent matches", () => {
            const parent = makeElement("parent-1", "Tabs");
            const doc = makeDocument([parent]);
            const components: Record<string, ComponentManifest> = {
                Tabs: makeManifest("Tabs"),
                TabPanel: makeManifest("TabPanel", {
                    constraints: [
                        {
                            check: (ctx: ConstraintContext) => ctx.isChildOf("Tabs"),
                            message: "TabPanel must be a direct child of Tabs"
                        }
                    ]
                })
            };

            const result = evaluateConstraints({
                componentName: "TabPanel",
                parentId: "parent-1",
                slot: "children",
                document: doc,
                components
            });
            expect(result.allowed).toBe(true);
        });

        it("should return false when direct parent does not match", () => {
            const parent = makeElement("parent-1", "Container");
            const doc = makeDocument([parent]);
            const components: Record<string, ComponentManifest> = {
                Container: makeManifest("Container"),
                TabPanel: makeManifest("TabPanel", {
                    constraints: [
                        {
                            check: (ctx: ConstraintContext) => ctx.isChildOf("Tabs"),
                            message: "TabPanel must be a direct child of Tabs"
                        }
                    ]
                })
            };

            const result = evaluateConstraints({
                componentName: "TabPanel",
                parentId: "parent-1",
                slot: "children",
                document: doc,
                components
            });
            expect(result.allowed).toBe(false);
        });
    });

    describe("ctx.isDescendantOf", () => {
        it("should return true when direct parent matches", () => {
            const parent = makeElement("parent-1", "ProductBox");
            const doc = makeDocument([parent]);
            const components: Record<string, ComponentManifest> = {
                ProductBox: makeManifest("ProductBox"),
                ProductPrice: makeManifest("ProductPrice", {
                    constraints: [
                        {
                            check: (ctx: ConstraintContext) => ctx.isDescendantOf("ProductBox")
                        }
                    ]
                })
            };

            const result = evaluateConstraints({
                componentName: "ProductPrice",
                parentId: "parent-1",
                slot: "children",
                document: doc,
                components
            });
            expect(result.allowed).toBe(true);
        });

        it("should return true when grandparent matches", () => {
            const root = makeElement("root", "ProductBox");
            const inner = makeElement("inner", "Container", { id: "root", slot: "children" });
            const doc = makeDocument([root, inner]);
            const components: Record<string, ComponentManifest> = {
                ProductBox: makeManifest("ProductBox"),
                Container: makeManifest("Container"),
                ProductPrice: makeManifest("ProductPrice", {
                    constraints: [
                        {
                            check: (ctx: ConstraintContext) => ctx.isDescendantOf("ProductBox")
                        }
                    ]
                })
            };

            const result = evaluateConstraints({
                componentName: "ProductPrice",
                parentId: "inner",
                slot: "children",
                document: doc,
                components
            });
            expect(result.allowed).toBe(true);
        });

        it("should return false when no ancestor matches", () => {
            const root = makeElement("root", "Page");
            const inner = makeElement("inner", "Section", { id: "root", slot: "children" });
            const doc = makeDocument([root, inner]);
            const components: Record<string, ComponentManifest> = {
                Page: makeManifest("Page"),
                Section: makeManifest("Section"),
                ProductPrice: makeManifest("ProductPrice", {
                    constraints: [
                        {
                            check: (ctx: ConstraintContext) => ctx.isDescendantOf("ProductBox")
                        }
                    ]
                })
            };

            const result = evaluateConstraints({
                componentName: "ProductPrice",
                parentId: "inner",
                slot: "children",
                document: doc,
                components
            });
            expect(result.allowed).toBe(false);
        });
    });

    describe("ctx.slotChildCount", () => {
        it("should return the number of children in the target slot", () => {
            const parent = makeElement("parent-1", "Grid");
            const doc = makeDocument([parent], {
                "parent-1": {
                    inputs: {
                        children: {
                            id: "inp-1",
                            type: "slot",
                            static: ["child-1", "child-2", "child-3"]
                        }
                    }
                }
            });

            const components: Record<string, ComponentManifest> = {
                Grid: makeManifest("Grid"),
                Cell: makeManifest("Cell", {
                    constraints: [
                        {
                            check: (ctx: ConstraintContext) => ctx.slotChildCount() < 3,
                            message: "Max 3 children"
                        }
                    ]
                })
            };

            const result = evaluateConstraints({
                componentName: "Cell",
                parentId: "parent-1",
                slot: "children",
                document: doc,
                components
            });
            expect(result.allowed).toBe(false);
        });

        it("should return 0 when slot has no bindings", () => {
            const parent = makeElement("parent-1", "Container");
            const doc = makeDocument([parent]);

            const components: Record<string, ComponentManifest> = {
                Container: makeManifest("Container"),
                Widget: makeManifest("Widget", {
                    constraints: [
                        {
                            check: (ctx: ConstraintContext) => ctx.slotChildCount() < 5
                        }
                    ]
                })
            };

            const result = evaluateConstraints({
                componentName: "Widget",
                parentId: "parent-1",
                slot: "children",
                document: doc,
                components
            });
            expect(result.allowed).toBe(true);
        });
    });
});
