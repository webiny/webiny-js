import { BindingsProcessor } from "./BindingsProcessor";
import type { DocumentElementBindings } from "~/sdk/types";

describe("BindingsProcessor", () => {
    const breakpoints = ["desktop", "tablet", "mobile"];
    const processor = new BindingsProcessor(breakpoints);

    const bindings: DocumentElementBindings = {
        inputs: {
            title: { id: "title", static: "Hello", type: "text" },
            count: { id: "count", static: 1, type: "number", expression: "$state.count" }
        },
        styles: {
            paddingTop: { static: "10px" },
            backgroundColor: { static: "white" }
        },
        overrides: {
            tablet: {
                inputs: {
                    title: { id: "title", static: "Hello Tablet", type: "text" }
                },
                styles: {
                    backgroundColor: { static: "gray" }
                }
            },
            mobile: {
                inputs: {
                    count: { id: "count", static: 3, type: "number" }
                },
                styles: {
                    paddingTop: { static: "5px" }
                }
            }
        }
    };

    it("should return unmodified bindings when base breakpoint is specified", () => {
        const result = processor.getBindings(bindings, "desktop");
        expect(result.inputs).toEqual(bindings.inputs);
        expect(result.styles).toEqual(bindings.styles);
    });

    it("should merge tablet overrides", () => {
        const result = processor.getBindings(bindings, "tablet");
        expect(result.inputs?.title.static).toBe("Hello Tablet");
        expect(result.inputs?.count.static).toBe(1);
        expect(result.inputs?.count.expression).toBe("$state.count");
        expect(result.styles?.backgroundColor?.static).toBe("gray");
        expect(result.styles?.paddingTop?.static).toBe("10px");
    });

    it("should merge mobile and tablet overrides", () => {
        const result = processor.getBindings(bindings, "mobile");
        expect(result.inputs?.title.static).toBe("Hello Tablet");
        expect(result.inputs?.count.static).toBe(3);
        expect(result.inputs?.count.expression).toBe("$state.count");
        expect(result.styles?.backgroundColor?.static).toBe("gray");
        expect(result.styles?.paddingTop?.static).toBe("5px");
    });

    it("should ignore unknown breakpoints", () => {
        const result = processor.getBindings(bindings, "unknown");
        expect(result.inputs).toEqual(bindings.inputs);
        expect(result.styles).toEqual(bindings.styles);
    });
});
