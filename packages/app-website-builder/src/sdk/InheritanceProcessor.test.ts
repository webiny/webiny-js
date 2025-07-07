import { InheritanceProcessor } from "./InheritanceProcessor";
import type { InputAstNode } from "~/sdk/ComponentManifestToAstConverter";

// Mock AST for inputs
const inputsAst: InputAstNode[] = [
    {
        name: "rowGap",
        type: "text",
        list: false,
        path: "rowGap",
        children: [],
        input: { type: "text", responsive: true, name: "rowGap" }
    },
    {
        name: "title",
        type: "text",
        list: false,
        path: "title",
        children: [],
        input: { type: "text", responsive: false, name: "title" }
    }
];

describe("InheritanceProcessor", () => {
    const breakpoints = ["desktop", "tablet", "mobile"];
    const processor = new InheritanceProcessor(breakpoints, inputsAst);

    it("should correctly compute inheritance info for responsive inputs and styles", () => {
        const bindings = {
            inputs: {
                rowGap: { static: "20px" },
                title: { static: "Default Title" }
            },
            styles: {
                paddingTop: { static: "10px" },
                color: { static: "red" }
            },
            overrides: {
                tablet: {
                    styles: {
                        paddingTop: { static: "5px" }
                    }
                },
                mobile: {
                    inputs: {
                        rowGap: { static: "10px" }
                    },
                    styles: {
                        paddingTop: { static: "2px" },
                        color: { static: "blue" }
                    }
                }
            }
        };

        // desktop breakpoint
        const desktopResult = processor.getInheritanceMap(bindings as any, "desktop");

        expect(desktopResult.inputs["rowGap"]).toEqual({
            overridden: true,
            inheritedFrom: undefined
        });
        expect(desktopResult.inputs["title"]).toBeUndefined(); // not responsive
        expect(desktopResult.styles["paddingTop"]).toEqual({
            overridden: true,
            inheritedFrom: undefined
        });
        expect(desktopResult.styles["color"]).toEqual({
            overridden: true,
            inheritedFrom: undefined
        });

        // tablet breakpoint
        const tabletResult = processor.getInheritanceMap(bindings as any, "tablet");

        expect(tabletResult.inputs["rowGap"]).toEqual({
            overridden: false,
            inheritedFrom: "desktop"
        });
        expect(tabletResult.styles["paddingTop"]).toEqual({
            overridden: true,
            inheritedFrom: "desktop"
        });
        expect(tabletResult.styles["color"]).toEqual({
            overridden: false,
            inheritedFrom: "desktop"
        });

        // mobile breakpoint
        const mobileResult = processor.getInheritanceMap(bindings as any, "mobile");

        expect(mobileResult.inputs["rowGap"]).toEqual({
            overridden: true,
            inheritedFrom: "desktop"
        });
        expect(mobileResult.styles["paddingTop"]).toEqual({
            overridden: true,
            inheritedFrom: "tablet"
        });
        expect(mobileResult.styles["color"]).toEqual({
            overridden: true,
            inheritedFrom: "desktop"
        });
    });

    it("should skip non-responsive inputs in inheritance info", () => {
        const bindings = {
            inputs: {
                title: { static: "Static Title" }
            },
            styles: {},
            overrides: {}
        };

        const result = processor.getInheritanceMap(bindings as any, "desktop");
        expect(result.inputs["title"]).toBeUndefined();
    });

    it("should handle missing overrides gracefully", () => {
        const bindings = {
            inputs: {
                rowGap: { static: "20px" }
            },
            styles: {
                paddingTop: { static: "10px" }
            }
            // no overrides
        };

        const result = processor.getInheritanceMap(bindings as any, "mobile");
        expect(result.inputs["rowGap"]).toEqual({ overridden: false, inheritedFrom: "desktop" });
        expect(result.styles["paddingTop"]).toEqual({
            overridden: false,
            inheritedFrom: "desktop"
        });
    });

    it("should handle missing ancestor values gracefully", () => {
        const bindings = {
            inputs: {},
            styles: {
                backgroundColor: {
                    static: "#ec8787"
                }
            },
            overrides: {
                tablet: {
                    styles: {}
                },
                mobile: {
                    styles: {
                        backgroundColor: {
                            static: "#50e3c2"
                        },
                        marginTop: {
                            static: "122px"
                        }
                    }
                }
            }
        };

        const result = processor.getInheritanceMap(bindings as any, "mobile");
        expect(result.styles["backgroundColor"]).toEqual({
            overridden: true,
            inheritedFrom: "desktop"
        });

        expect(result.styles["marginTop"]).toEqual({
            overridden: true,
            inheritedFrom: "desktop"
        });
    });
});
