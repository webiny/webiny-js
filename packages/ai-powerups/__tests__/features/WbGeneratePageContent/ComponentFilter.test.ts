import { describe, it, expect, beforeEach } from "vitest";
import { ComponentFilter } from "~/api/features/WbGeneratePageContent/ComponentFilter.js";

const catalog = [
    { name: "Webiny/Grid" },
    { name: "Webiny/GridColumn" },
    { name: "Webiny/Lexical" },
    { name: "Webiny/Image" },
    { name: "Webiny/Box" }
];

describe("ComponentFilter", () => {
    let filter: ComponentFilter;

    beforeEach(() => {
        filter = new ComponentFilter(catalog);
    });

    it("should pass through all valid components unchanged", () => {
        const elements = [
            { component: "Webiny/Lexical", inputs: { content: "hello" } },
            { component: "Webiny/Image", inputs: { src: "img.png" } }
        ];

        expect(filter.filter(elements)).toEqual(elements);
    });

    it("should remove root-level elements with invalid component names", () => {
        const elements = [
            { component: "Webiny/Lexical", inputs: { content: "hello" } },
            { component: "Webiny/FakeComponent", inputs: { content: "bad" } },
            { component: "Webiny/Image", inputs: { src: "img.png" } }
        ];

        expect(filter.filter(elements)).toEqual([
            { component: "Webiny/Lexical", inputs: { content: "hello" } },
            { component: "Webiny/Image", inputs: { src: "img.png" } }
        ]);
    });

    it("should remove nested CreateElement actions with invalid components", () => {
        const elements = [
            {
                component: "Webiny/Box",
                inputs: {
                    children: [
                        {
                            action: "CreateElement",
                            params: {
                                component: "Webiny/Lexical",
                                inputs: { content: "valid" }
                            }
                        },
                        {
                            action: "CreateElement",
                            params: {
                                component: "Webiny/MadeUp",
                                inputs: { content: "invalid" }
                            }
                        }
                    ]
                }
            }
        ];

        const result = filter.filter(elements);
        const children = (result[0] as any).inputs.children;
        expect(children).toHaveLength(1);
        expect(children[0].params.component).toBe("Webiny/Lexical");
    });

    it("should handle deeply nested Grid > GridColumn > children", () => {
        const elements = [
            {
                component: "Webiny/Grid",
                inputs: {
                    gridLayout: "6-6",
                    columns: [
                        {
                            children: {
                                action: "CreateElement",
                                params: {
                                    component: "Webiny/GridColumn",
                                    inputs: {
                                        children: [
                                            {
                                                action: "CreateElement",
                                                params: {
                                                    component: "Webiny/Lexical",
                                                    inputs: { content: "valid" }
                                                }
                                            },
                                            {
                                                action: "CreateElement",
                                                params: {
                                                    component: "Webiny/Hallucinated",
                                                    inputs: { content: "bad" }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        ];

        const result = filter.filter(elements);
        const column = (result[0] as any).inputs.columns[0].children;
        const innerChildren = column.params.inputs.children;
        expect(innerChildren).toHaveLength(1);
        expect(innerChildren[0].params.component).toBe("Webiny/Lexical");
    });

    it("should leave tool envelopes untouched", () => {
        const elements = [
            {
                component: "Webiny/Lexical",
                inputs: {
                    content: {
                        tool: "textToLexical",
                        params: { text: "hello" }
                    }
                }
            }
        ];

        expect(filter.filter(elements)).toEqual(elements);
    });

    it("should return empty array when all components are invalid", () => {
        const elements = [
            { component: "Fake/One", inputs: {} },
            { component: "Fake/Two", inputs: {} }
        ];

        expect(filter.filter(elements)).toEqual([]);
    });

    it("should return empty array for empty input", () => {
        expect(filter.filter([])).toEqual([]);
    });

    it("should keep parent when removing children empties a slot", () => {
        const elements = [
            {
                component: "Webiny/Box",
                inputs: {
                    children: [
                        {
                            action: "CreateElement",
                            params: {
                                component: "Webiny/NonExistent",
                                inputs: {}
                            }
                        }
                    ]
                }
            }
        ];

        const result = filter.filter(elements);
        expect(result).toHaveLength(1);
        expect((result[0] as any).inputs.children).toEqual([]);
    });

    it("should remove a single CreateElement in a slot input when invalid", () => {
        const elements = [
            {
                component: "Webiny/Grid",
                inputs: {
                    columns: [
                        {
                            children: {
                                action: "CreateElement",
                                params: {
                                    component: "Webiny/NonExistent",
                                    inputs: {}
                                }
                            }
                        }
                    ]
                }
            }
        ];

        const result = filter.filter(elements);
        const column = (result[0] as any).inputs.columns[0].children;
        expect(column).toBeNull();
    });

    it("should preserve non-element values in inputs", () => {
        const elements = [
            {
                component: "Webiny/Grid",
                inputs: {
                    gridLayout: "6-6",
                    someFlag: true,
                    count: 42
                }
            }
        ];

        expect(filter.filter(elements)).toEqual(elements);
    });
});
