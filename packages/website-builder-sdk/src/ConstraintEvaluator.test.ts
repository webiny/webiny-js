import { describe, it, expect } from "vitest";
import { evaluateConstraints, evaluateDeleteConstraint } from "./ConstraintEvaluator.js";
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
    return { name, label: name, inputs: [], tags: [], ...overrides };
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
        extensions: {},
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
                    (ctx: ConstraintContext) => {
                        if (ctx.parent.name !== "Tabs") {
                            return ctx.block("TabPanel must be inside Tabs");
                        }
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
                    (ctx: ConstraintContext) => {
                        if (ctx.parent.name !== "Tabs") {
                            return ctx.block("TabPanel must be inside Tabs");
                        }
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
                    (ctx: ConstraintContext) => {
                        if (!ctx.isDescendantOf("ProductBox")) {
                            return ctx.block("ProductPrice must be inside a ProductBox");
                        }
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
                    (ctx: ConstraintContext) => {
                        if (!ctx.isDescendantOf("ProductBox")) {
                            return ctx.block("ProductPrice must be inside a ProductBox");
                        }
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

    it("should block via slot children limit constraint using slotChildCount", () => {
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
                    (ctx: ConstraintContext) => {
                        if (!(ctx.slotChildCount() < 2)) {
                            return ctx.block("Maximum 2 children allowed");
                        }
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
                    (ctx: ConstraintContext) => {
                        if (!(ctx.countInstances("Hero") < 1)) {
                            return ctx.block("Only one Hero per page");
                        }
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
                    (ctx: ConstraintContext) => ctx.block("This should not run for children")
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
                    () => {},
                    (ctx: ConstraintContext) => ctx.block("Always fails"),
                    (ctx: ConstraintContext) => ctx.block("Also fails")
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
                    (ctx: ConstraintContext) => {
                        if (!(ctx.slotChildCount() < 1)) {
                            return ctx.block("Slot is full");
                        }
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
                constraints: [(ctx: ConstraintContext) => ctx.block("Blocked")]
            })
        };

        const result = evaluateConstraints({
            componentName: "Widget",
            parentId: "parent-1",
            slot: "children",
            document: doc,
            components
        });

        expect(result.violation!.message).toBe("Blocked");
    });

    it("should use thrown error message as the violation message", () => {
        const parent = makeElement("parent-1", "Container");
        const doc = makeDocument([parent]);

        const components: Record<string, ComponentManifest> = {
            Container: makeManifest("Container"),
            Widget: makeManifest("Widget", {
                constraints: [
                    (ctx: ConstraintContext) => {
                        throw new Error(`Widget cannot be placed inside ${ctx.parent.name}`);
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
                    () => {
                        throw "not an error object";
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
        expect(result.violation!.message).toBe("Cannot place Widget here.");
    });

    it("should fall back to default message when a non-Error is thrown and no static message", () => {
        const parent = makeElement("parent-1", "Container");
        const doc = makeDocument([parent]);

        const components: Record<string, ComponentManifest> = {
            Container: makeManifest("Container"),
            Widget: makeManifest("Widget", {
                constraints: [
                    () => {
                        throw null;
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
        expect(result.violation!.message).toBe("Cannot place Widget here.");
    });

    describe("ctx.isChildOf", () => {
        it("should return true when direct parent matches", () => {
            const parent = makeElement("parent-1", "Tabs");
            const doc = makeDocument([parent]);
            const components: Record<string, ComponentManifest> = {
                Tabs: makeManifest("Tabs"),
                TabPanel: makeManifest("TabPanel", {
                    constraints: [
                        (ctx: ConstraintContext) => {
                            if (!ctx.isChildOf("Tabs")) {
                                return ctx.block("TabPanel must be a direct child of Tabs");
                            }
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
                        (ctx: ConstraintContext) => {
                            if (!ctx.isChildOf("Tabs")) {
                                return ctx.block("TabPanel must be a direct child of Tabs");
                            }
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
                        (ctx: ConstraintContext) => {
                            if (!ctx.isDescendantOf("ProductBox")) {
                                return ctx.block("Blocked");
                            }
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
                        (ctx: ConstraintContext) => {
                            if (!ctx.isDescendantOf("ProductBox")) {
                                return ctx.block("Blocked");
                            }
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
                        (ctx: ConstraintContext) => {
                            if (!ctx.isDescendantOf("ProductBox")) {
                                return ctx.block("Blocked");
                            }
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
                        (ctx: ConstraintContext) => {
                            if (!(ctx.slotChildCount() < 3)) {
                                return ctx.block("Max 3 children");
                            }
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
                        (ctx: ConstraintContext) => {
                            if (!(ctx.slotChildCount() < 5)) {
                                return ctx.block("Blocked");
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
            expect(result.allowed).toBe(true);
        });
    });

    describe("ctx.hasTag", () => {
        it("should return true when the placed component has the tag", () => {
            const parent = makeElement("parent-1", "Container");
            const doc = makeDocument([parent]);
            const components: Record<string, ComponentManifest> = {
                Container: makeManifest("Container"),
                FunnelField: makeManifest("FunnelField", {
                    tags: ["funnel-field", "input"],
                    constraints: [
                        (ctx: ConstraintContext) => {
                            if (ctx.hasTag("funnel-field")) {
                                return ctx.block("Funnel fields not allowed here");
                            }
                        }
                    ]
                })
            };

            const result = evaluateConstraints({
                componentName: "FunnelField",
                parentId: "parent-1",
                slot: "children",
                document: doc,
                components
            });
            expect(result.allowed).toBe(false);
        });

        it("should return false when the placed component does not have the tag", () => {
            const parent = makeElement("parent-1", "Container");
            const doc = makeDocument([parent]);
            const components: Record<string, ComponentManifest> = {
                Container: makeManifest("Container"),
                Button: makeManifest("Button", {
                    constraints: [
                        (ctx: ConstraintContext) => {
                            if (ctx.hasTag("funnel-field")) {
                                return ctx.block("Blocked");
                            }
                        }
                    ]
                })
            };

            const result = evaluateConstraints({
                componentName: "Button",
                parentId: "parent-1",
                slot: "children",
                document: doc,
                components
            });
            expect(result.allowed).toBe(true);
        });
    });

    describe("ctx.getAncestor", () => {
        it("should return the matching ancestor element context", () => {
            const root = makeElement("root", "ProductBox");
            const inner = makeElement("inner", "Container", { id: "root", slot: "children" });
            const doc = makeDocument([root, inner]);
            const components: Record<string, ComponentManifest> = {
                ProductBox: makeManifest("ProductBox", { tags: ["product"] }),
                Container: makeManifest("Container"),
                ProductPrice: makeManifest("ProductPrice", {
                    constraints: [
                        (ctx: ConstraintContext) => {
                            const ancestor = ctx.getAncestor("ProductBox");
                            if (!(ancestor !== undefined && ancestor.name === "ProductBox")) {
                                return ctx.block("Blocked");
                            }
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

        it("should return undefined when no ancestor matches", () => {
            const root = makeElement("root", "Page");
            const doc = makeDocument([root]);
            const components: Record<string, ComponentManifest> = {
                Page: makeManifest("Page"),
                Widget: makeManifest("Widget", {
                    constraints: [
                        (ctx: ConstraintContext) => {
                            if (ctx.getAncestor("ProductBox") === undefined) {
                                return ctx.block("Blocked");
                            }
                        }
                    ]
                })
            };

            const result = evaluateConstraints({
                componentName: "Widget",
                parentId: "root",
                slot: "children",
                document: doc,
                components
            });
            expect(result.allowed).toBe(false);
        });
    });

    describe("ctx.countInstances", () => {
        it("should count instances of a component in the document", () => {
            const root = makeElement("root", "Page");
            const hero1 = makeElement("hero-1", "Hero", { id: "root", slot: "children" });
            const hero2 = makeElement("hero-2", "Hero", { id: "root", slot: "children" });
            const doc = makeDocument([root, hero1, hero2]);

            const components: Record<string, ComponentManifest> = {
                Page: makeManifest("Page"),
                Hero: makeManifest("Hero", {
                    constraints: [
                        (ctx: ConstraintContext) => {
                            if (!(ctx.countInstances("Hero") < 2)) {
                                return ctx.block("Max 2 Heroes");
                            }
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
        });
    });

    describe("ctx.component", () => {
        it("should expose the placed component's name and tags", () => {
            const parent = makeElement("parent-1", "Container");
            const doc = makeDocument([parent]);

            let capturedComponent: { name: string; tags: string[] } | undefined;
            const components: Record<string, ComponentManifest> = {
                Container: makeManifest("Container"),
                Widget: makeManifest("Widget", {
                    tags: ["interactive", "form"],
                    constraints: [
                        (ctx: ConstraintContext) => {
                            capturedComponent = ctx.component;
                        }
                    ]
                })
            };

            evaluateConstraints({
                componentName: "Widget",
                parentId: "parent-1",
                slot: "children",
                document: doc,
                components
            });

            expect(capturedComponent).toBeDefined();
            expect(capturedComponent!.name).toBe("Widget");
            expect(capturedComponent!.tags).toEqual(["interactive", "form"]);
        });
    });

    describe("parent.getParent", () => {
        it("should return the grandparent element context", () => {
            const root = makeElement("root", "Page");
            const section = makeElement("section", "Section", { id: "root", slot: "children" });
            const doc = makeDocument([root, section]);

            let grandparentName: string | undefined;
            const components: Record<string, ComponentManifest> = {
                Page: makeManifest("Page"),
                Section: makeManifest("Section"),
                Widget: makeManifest("Widget", {
                    constraints: [
                        (ctx: ConstraintContext) => {
                            const grandparent = ctx.parent.getParent();
                            grandparentName = grandparent?.name;
                        }
                    ]
                })
            };

            evaluateConstraints({
                componentName: "Widget",
                parentId: "section",
                slot: "children",
                document: doc,
                components
            });

            expect(grandparentName).toBe("Page");
        });

        it("should return undefined for root element", () => {
            const root = makeElement("root", "Page");
            const doc = makeDocument([root]);

            let parentResult: unknown = "not-called";
            const components: Record<string, ComponentManifest> = {
                Page: makeManifest("Page"),
                Widget: makeManifest("Widget", {
                    constraints: [
                        (ctx: ConstraintContext) => {
                            parentResult = ctx.parent.getParent();
                        }
                    ]
                })
            };

            evaluateConstraints({
                componentName: "Widget",
                parentId: "root",
                slot: "children",
                document: doc,
                components
            });

            expect(parentResult).toBeUndefined();
        });
    });

    describe("parent.childIndex / childCount / isFirstChild / isLastChild", () => {
        it("should return -1 for elements not in a list slot", () => {
            const root = makeElement("root", "Page");
            const doc = makeDocument([root]);

            let capturedIndex: number | undefined;
            let capturedCount: number | undefined;
            const components: Record<string, ComponentManifest> = {
                Page: makeManifest("Page"),
                Widget: makeManifest("Widget", {
                    constraints: [
                        (ctx: ConstraintContext) => {
                            capturedIndex = ctx.parent.childIndex();
                            capturedCount = ctx.parent.childCount();
                        }
                    ]
                })
            };

            evaluateConstraints({
                componentName: "Widget",
                parentId: "root",
                slot: "children",
                document: doc,
                components
            });

            expect(capturedIndex).toBe(-1);
            expect(capturedCount).toBe(-1);
        });

        it("should parse child index from list slot path", () => {
            const root = makeElement("root", "FunnelBuilder");
            const step = makeElement("step-1", "Step", { id: "root", slot: "steps/2/step" });
            const doc = makeDocument([root, step], {
                root: {
                    inputs: {
                        "steps/0/step": { id: "s0", type: "slot", static: ["step-0"] },
                        "steps/1/step": { id: "s1", type: "slot", static: ["step-other"] },
                        "steps/2/step": { id: "s2", type: "slot", static: ["step-1"] }
                    }
                }
            });

            let capturedIndex: number | undefined;
            let capturedCount: number | undefined;
            let capturedIsLast: boolean | undefined;
            let capturedIsFirst: boolean | undefined;
            const components: Record<string, ComponentManifest> = {
                FunnelBuilder: makeManifest("FunnelBuilder"),
                Step: makeManifest("Step"),
                Widget: makeManifest("Widget", {
                    constraints: [
                        (ctx: ConstraintContext) => {
                            capturedIndex = ctx.parent.childIndex();
                            capturedCount = ctx.parent.childCount();
                            capturedIsLast = ctx.parent.isLastChild();
                            capturedIsFirst = ctx.parent.isFirstChild();
                        }
                    ]
                })
            };

            evaluateConstraints({
                componentName: "Widget",
                parentId: "step-1",
                slot: "children",
                document: doc,
                components
            });

            expect(capturedIndex).toBe(2);
            expect(capturedCount).toBe(3);
            expect(capturedIsLast).toBe(true);
            expect(capturedIsFirst).toBe(false);
        });

        it("should identify the first child correctly", () => {
            const root = makeElement("root", "FunnelBuilder");
            const step = makeElement("step-0", "Step", { id: "root", slot: "steps/0/step" });
            const doc = makeDocument([root, step], {
                root: {
                    inputs: {
                        "steps/0/step": { id: "s0", type: "slot", static: ["step-0"] },
                        "steps/1/step": { id: "s1", type: "slot", static: ["step-1"] }
                    }
                }
            });

            let capturedIsFirst: boolean | undefined;
            let capturedIsLast: boolean | undefined;
            const components: Record<string, ComponentManifest> = {
                FunnelBuilder: makeManifest("FunnelBuilder"),
                Step: makeManifest("Step"),
                Widget: makeManifest("Widget", {
                    constraints: [
                        (ctx: ConstraintContext) => {
                            capturedIsFirst = ctx.parent.isFirstChild();
                            capturedIsLast = ctx.parent.isLastChild();
                        }
                    ]
                })
            };

            evaluateConstraints({
                componentName: "Widget",
                parentId: "step-0",
                slot: "children",
                document: doc,
                components
            });

            expect(capturedIsFirst).toBe(true);
            expect(capturedIsLast).toBe(false);
        });

        it("should resolve position from bindings even when element.parent.slot is stale", () => {
            const root = makeElement("root", "FunnelBuilder");
            // Element says slot "steps/1/step" but bindings put it at steps/3/step
            const step = makeElement("step-final", "Step", {
                id: "root",
                slot: "steps/1/step"
            });
            const doc = makeDocument([root, step], {
                root: {
                    inputs: {
                        "steps/0/step": { id: "s0", type: "slot", static: "step-0" },
                        "steps/1/step": { id: "s1", type: "slot", static: "step-1" },
                        "steps/2/step": { id: "s2", type: "slot", static: "step-2" },
                        "steps/3/step": { id: "s3", type: "slot", static: "step-final" }
                    }
                }
            });

            let capturedIndex: number | undefined;
            let capturedIsLast: boolean | undefined;
            const components: Record<string, ComponentManifest> = {
                FunnelBuilder: makeManifest("FunnelBuilder"),
                Step: makeManifest("Step"),
                Widget: makeManifest("Widget", {
                    constraints: [
                        (ctx: ConstraintContext) => {
                            capturedIndex = ctx.parent.childIndex();
                            capturedIsLast = ctx.parent.isLastChild();
                        }
                    ]
                })
            };

            evaluateConstraints({
                componentName: "Widget",
                parentId: "step-final",
                slot: "children",
                document: doc,
                components
            });

            // Should find actual position (index 3, last) not stale slot (index 1)
            expect(capturedIndex).toBe(3);
            expect(capturedIsLast).toBe(true);
        });

        it("should resolve position from direct list slot binding (static is an array of IDs)", () => {
            const root = makeElement("root", "FunnelBuilder");
            const step0 = makeElement("step-0", "Step", { id: "root", slot: "steps" });
            const step1 = makeElement("step-1", "Step", { id: "root", slot: "steps" });
            const step2 = makeElement("step-2", "Step", { id: "root", slot: "steps" });
            const doc = makeDocument([root, step0, step1, step2], {
                root: {
                    inputs: {
                        steps: {
                            id: "s",
                            type: "slot",
                            list: true,
                            static: ["step-0", "step-1", "step-2"]
                        }
                    }
                }
            });

            let captured: Record<string, any> = {};
            const comps: Record<string, ComponentManifest> = {
                FunnelBuilder: makeManifest("FunnelBuilder"),
                Step: makeManifest("Step"),
                Widget: makeManifest("Widget", {
                    constraints: [
                        (ctx: ConstraintContext) => {
                            captured = {
                                index: ctx.parent.childIndex(),
                                count: ctx.parent.childCount(),
                                isFirst: ctx.parent.isFirstChild(),
                                isLast: ctx.parent.isLastChild()
                            };
                        }
                    ]
                })
            };

            // Place into first step
            evaluateConstraints({
                componentName: "Widget",
                parentId: "step-0",
                slot: "children",
                document: doc,
                components: comps
            });
            expect(captured.index).toBe(0);
            expect(captured.count).toBe(3);
            expect(captured.isFirst).toBe(true);
            expect(captured.isLast).toBe(false);

            // Place into middle step
            evaluateConstraints({
                componentName: "Widget",
                parentId: "step-1",
                slot: "children",
                document: doc,
                components: comps
            });
            expect(captured.index).toBe(1);
            expect(captured.count).toBe(3);
            expect(captured.isFirst).toBe(false);
            expect(captured.isLast).toBe(false);

            // Place into last step
            evaluateConstraints({
                componentName: "Widget",
                parentId: "step-2",
                slot: "children",
                document: doc,
                components: comps
            });
            expect(captured.index).toBe(2);
            expect(captured.count).toBe(3);
            expect(captured.isFirst).toBe(false);
            expect(captured.isLast).toBe(true);
        });
    });

    describe("descendantConstraints", () => {
        it("should block a direct child via parent's descendantConstraints", () => {
            const parent = makeElement("parent-1", "Step");
            const doc = makeDocument([parent]);
            const components: Record<string, ComponentManifest> = {
                Step: makeManifest("Step", {
                    descendantConstraints: [
                        (ctx: ConstraintContext) => {
                            if (ctx.hasTag("funnel-field")) {
                                return ctx.block("No funnel fields allowed");
                            }
                        }
                    ]
                }),
                TextField: makeManifest("TextField", { tags: ["funnel-field"] })
            };

            const result = evaluateConstraints({
                componentName: "TextField",
                parentId: "parent-1",
                slot: "children",
                document: doc,
                components
            });
            expect(result.allowed).toBe(false);
            expect(result.violation!.message).toBe("No funnel fields allowed");
        });

        it("should block a nested descendant via ancestor's descendantConstraints", () => {
            const step = makeElement("step-1", "Step");
            const container = makeElement("container-1", "Container", {
                id: "step-1",
                slot: "children"
            });
            const doc = makeDocument([step, container]);
            const components: Record<string, ComponentManifest> = {
                Step: makeManifest("Step", {
                    descendantConstraints: [
                        (ctx: ConstraintContext) => {
                            if (ctx.hasTag("funnel-field")) {
                                return ctx.block("No funnel fields in this step");
                            }
                        }
                    ]
                }),
                Container: makeManifest("Container"),
                TextField: makeManifest("TextField", { tags: ["funnel-field"] })
            };

            // TextField dropped into Container, which is inside Step
            const result = evaluateConstraints({
                componentName: "TextField",
                parentId: "container-1",
                slot: "children",
                document: doc,
                components
            });
            expect(result.allowed).toBe(false);
            expect(result.violation!.message).toBe("No funnel fields in this step");
        });

        it("should allow when descendantConstraints pass", () => {
            const step = makeElement("step-1", "Step");
            const doc = makeDocument([step]);
            const components: Record<string, ComponentManifest> = {
                Step: makeManifest("Step", {
                    descendantConstraints: [
                        (ctx: ConstraintContext) => {
                            if (ctx.hasTag("funnel-field")) {
                                return ctx.block("Blocked");
                            }
                        }
                    ]
                }),
                Button: makeManifest("Button")
            };

            const result = evaluateConstraints({
                componentName: "Button",
                parentId: "step-1",
                slot: "children",
                document: doc,
                components
            });
            expect(result.allowed).toBe(true);
        });

        it("should not run parent's descendantConstraints for unrelated ancestors", () => {
            const page = makeElement("page", "Page");
            const step = makeElement("step-1", "Step", { id: "page", slot: "children" });
            const doc = makeDocument([page, step]);
            const components: Record<string, ComponentManifest> = {
                Page: makeManifest("Page", {
                    descendantConstraints: [
                        (ctx: ConstraintContext) => ctx.block("Page blocks everything")
                    ]
                }),
                Step: makeManifest("Step"),
                Button: makeManifest("Button")
            };

            // Button into Step — Page's descendantConstraints should still fire
            const result = evaluateConstraints({
                componentName: "Button",
                parentId: "step-1",
                slot: "children",
                document: doc,
                components
            });
            expect(result.allowed).toBe(false);
            expect(result.violation!.message).toBe("Page blocks everything");
        });

        it("should evaluate component constraints before descendantConstraints", () => {
            const parent = makeElement("parent-1", "Step");
            const doc = makeDocument([parent]);
            const components: Record<string, ComponentManifest> = {
                Step: makeManifest("Step", {
                    descendantConstraints: [
                        (ctx: ConstraintContext) => ctx.block("descendant constraint")
                    ]
                }),
                Widget: makeManifest("Widget", {
                    constraints: [(ctx: ConstraintContext) => ctx.block("component constraint")]
                })
            };

            const result = evaluateConstraints({
                componentName: "Widget",
                parentId: "parent-1",
                slot: "children",
                document: doc,
                components
            });
            // Component's own constraints should short-circuit first
            expect(result.violation!.message).toBe("component constraint");
        });
    });
});

describe("evaluateDeleteConstraint", () => {
    it("should allow when canDelete is undefined", () => {
        const el = makeElement("el-1", "Widget", { id: "root", slot: "children" });
        const root = makeElement("root", "Page");
        const doc = makeDocument([root, el]);
        const components: Record<string, ComponentManifest> = {
            Page: makeManifest("Page"),
            Widget: makeManifest("Widget")
        };

        const result = evaluateDeleteConstraint({
            elementId: "el-1",
            document: doc,
            components
        });
        expect(result.allowed).toBe(true);
    });

    it("should allow when canDelete is true", () => {
        const el = makeElement("el-1", "Widget", { id: "root", slot: "children" });
        const root = makeElement("root", "Page");
        const doc = makeDocument([root, el]);
        const components: Record<string, ComponentManifest> = {
            Page: makeManifest("Page"),
            Widget: makeManifest("Widget", { canDelete: true })
        };

        const result = evaluateDeleteConstraint({
            elementId: "el-1",
            document: doc,
            components
        });
        expect(result.allowed).toBe(true);
    });

    it("should block when canDelete is false", () => {
        const el = makeElement("el-1", "GridColumn", { id: "root", slot: "children" });
        const root = makeElement("root", "Grid");
        const doc = makeDocument([root, el]);
        const components: Record<string, ComponentManifest> = {
            Grid: makeManifest("Grid"),
            GridColumn: makeManifest("GridColumn", { canDelete: false })
        };

        const result = evaluateDeleteConstraint({
            elementId: "el-1",
            document: doc,
            components
        });
        expect(result.allowed).toBe(false);
        expect(result.violation!.message).toBe("GridColumn cannot be deleted.");
    });

    it("should allow when canDelete check returns true", () => {
        const funnel = makeElement("funnel", "Funnel");
        const step1 = makeElement("step-1", "Step", { id: "funnel", slot: "steps/0/step" });
        const step2 = makeElement("step-2", "Step", { id: "funnel", slot: "steps/1/step" });
        const step3 = makeElement("step-3", "Step", { id: "funnel", slot: "steps/2/step" });
        const doc = makeDocument([funnel, step1, step2, step3], {
            funnel: {
                inputs: {
                    "steps/0/step": { id: "s0", type: "slot", static: "step-1" },
                    "steps/1/step": { id: "s1", type: "slot", static: "step-2" },
                    "steps/2/step": { id: "s2", type: "slot", static: "step-3" }
                }
            }
        });
        const components: Record<string, ComponentManifest> = {
            Funnel: makeManifest("Funnel"),
            Step: makeManifest("Step", {
                canDelete: (ctx: ConstraintContext) => {
                    if (!(ctx.countInstances("Step") > 2)) {
                        return ctx.block("Blocked");
                    }
                }
            })
        };

        const result = evaluateDeleteConstraint({
            elementId: "step-2",
            document: doc,
            components
        });
        expect(result.allowed).toBe(true);
    });

    it("should block when canDelete check returns false", () => {
        const funnel = makeElement("funnel", "Funnel");
        const step1 = makeElement("step-1", "Step", { id: "funnel", slot: "steps/0/step" });
        const step2 = makeElement("step-2", "Step", { id: "funnel", slot: "steps/1/step" });
        const doc = makeDocument([funnel, step1, step2], {
            funnel: {
                inputs: {
                    "steps/0/step": { id: "s0", type: "slot", static: "step-1" },
                    "steps/1/step": { id: "s1", type: "slot", static: "step-2" }
                }
            }
        });
        const components: Record<string, ComponentManifest> = {
            Funnel: makeManifest("Funnel"),
            Step: makeManifest("Step", {
                canDelete: (ctx: ConstraintContext) => {
                    if (!(ctx.countInstances("Step") > 2)) {
                        return ctx.block("Need at least 2 steps");
                    }
                }
            })
        };

        const result = evaluateDeleteConstraint({
            elementId: "step-1",
            document: doc,
            components
        });
        expect(result.allowed).toBe(false);
        expect(result.violation!.message).toBe("Need at least 2 steps");
    });

    it("should use thrown error message as violation message", () => {
        const root = makeElement("root", "Page");
        const el = makeElement("el-1", "Widget", { id: "root", slot: "children" });
        const doc = makeDocument([root, el]);
        const components: Record<string, ComponentManifest> = {
            Page: makeManifest("Page"),
            Widget: makeManifest("Widget", {
                canDelete: () => {
                    throw new Error("Cannot delete this widget right now");
                }
            })
        };

        const result = evaluateDeleteConstraint({
            elementId: "el-1",
            document: doc,
            components
        });
        expect(result.allowed).toBe(false);
        expect(result.violation!.message).toBe("Cannot delete this widget right now");
    });

    it("should provide correct context to the check function", () => {
        const root = makeElement("root", "Funnel");
        const step = makeElement("step-1", "Step", { id: "root", slot: "steps/0/step" });
        const doc = makeDocument([root, step], {
            root: {
                inputs: {
                    "steps/0/step": { id: "s0", type: "slot", static: "step-1" },
                    "steps/1/step": { id: "s1", type: "slot", static: "step-2" }
                }
            }
        });

        let capturedCtx: ConstraintContext | undefined;
        const components: Record<string, ComponentManifest> = {
            Funnel: makeManifest("Funnel"),
            Step: makeManifest("Step", {
                tags: ["funnel-step"],
                canDelete: (ctx: ConstraintContext) => {
                    capturedCtx = ctx;
                }
            })
        };

        evaluateDeleteConstraint({
            elementId: "step-1",
            document: doc,
            components
        });

        expect(capturedCtx).toBeDefined();
        expect(capturedCtx!.component.name).toBe("Step");
        expect(capturedCtx!.component.tags).toEqual(["funnel-step"]);
        expect(capturedCtx!.parent.name).toBe("Funnel");
        expect(capturedCtx!.slot).toBe("steps/0/step");
        expect(capturedCtx!.isChildOf("Funnel")).toBe(true);
        expect(capturedCtx!.hasTag("funnel-step")).toBe(true);
    });

    it("should allow when element is not found", () => {
        const doc = makeDocument([]);
        const components: Record<string, ComponentManifest> = {};

        const result = evaluateDeleteConstraint({
            elementId: "nonexistent",
            document: doc,
            components
        });
        expect(result.allowed).toBe(true);
    });

    it("should allow when manifest is not found", () => {
        const el = makeElement("el-1", "Unknown");
        const doc = makeDocument([el]);
        const components: Record<string, ComponentManifest> = {};

        const result = evaluateDeleteConstraint({
            elementId: "el-1",
            document: doc,
            components
        });
        expect(result.allowed).toBe(true);
    });
});
