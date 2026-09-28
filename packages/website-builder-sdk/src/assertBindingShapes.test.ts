import { describe, expect, it } from "vitest";
import { assertBindingShapes } from "./assertBindingShapes.js";
import { ComponentManifestToAstConverter } from "./ComponentManifestToAstConverter.js";

const ast = (inputs: unknown[]) => ComponentManifestToAstConverter.convert(inputs as never);

const SCALAR_LIST = ast([{ name: "features", type: "text", list: true }]);
const SCALAR = ast([{ name: "heading", type: "text" }]);
const OBJECT_LIST = ast([
    {
        name: "stats",
        type: "object",
        list: true,
        fields: [
            { name: "value", type: "text" },
            { name: "label", type: "text" }
        ]
    }
]);

const bindings = (inputs: Record<string, unknown>) => ({ inputs }) as never;

describe("assertBindingShapes", () => {
    it("reports a scalar written where a list is declared", () => {
        /*
         * The shape that made five pages return 500: a correct array arrived at the factory and the
         * traverser collapsed it to its last item while writing.
         */
        const violations = assertBindingShapes(
            bindings({ features: { static: "Dryer", type: "text", list: true } }),
            SCALAR_LIST
        );

        expect(violations).toEqual([
            { path: "features", declared: "list", found: "scalar", value: "Dryer" }
        ]);
    });

    it("accepts a scalar list stored element-wise", () => {
        const violations = assertBindingShapes(
            bindings({
                "features/0": { static: "Floors" },
                "features/1": { static: "Windows" }
            }),
            SCALAR_LIST
        );

        expect(violations).toEqual([]);
    });

    it("accepts a scalar list stored as an array on one binding", () => {
        const violations = assertBindingShapes(
            bindings({ features: { static: ["Floors", "Windows"] } }),
            SCALAR_LIST
        );

        expect(violations).toEqual([]);
    });

    it("accepts an empty list and an absent binding", () => {
        expect(assertBindingShapes(bindings({ features: { static: [] } }), SCALAR_LIST)).toEqual(
            []
        );
        expect(assertBindingShapes(bindings({}), SCALAR_LIST)).toEqual([]);
        expect(assertBindingShapes(bindings({ features: { static: null } }), SCALAR_LIST)).toEqual(
            []
        );
    });

    it("reports an array written where a scalar is declared", () => {
        // The inverse does not throw, so nothing else would ever notice it.
        const violations = assertBindingShapes(
            bindings({ heading: { static: ["one", "two"] } }),
            SCALAR
        );

        expect(violations).toEqual([
            { path: "heading", declared: "scalar", found: "list", value: ["one", "two"] }
        ]);
    });

    it("accepts an object list stored element-wise", () => {
        const violations = assertBindingShapes(
            bindings({
                "stats/0/value": { static: "80" },
                "stats/0/label": { static: "Walk Score" },
                "stats/1/value": { static: "86" },
                "stats/1/label": { static: "Bike Score" }
            }),
            OBJECT_LIST
        );

        expect(violations).toEqual([]);
    });
});
