import { describe, it, expect } from "vitest";
import type { IFieldValueFormatter, IFieldVM } from "~/features/formModel/index.js";
import { resolveItemDescription, resolveItemTitle } from "./resolveItemTitle.js";

const field = (name: string, type: string, value: unknown, extra: Partial<IFieldVM> = {}) =>
    ({ name, type, value, ...extra }) as IFieldVM;

const classTypes = [
    { label: "Fitness", value: "fitness" },
    { label: "Personal Training", value: "personal-training" }
];

describe("resolveItemTitle", () => {
    it("shows the label of a predefined value instead of its value", () => {
        const fields = [field("classType", "text", "personal-training", { options: classTypes })];

        expect(resolveItemTitle(fields, 0, "Item #1", "classType", [])).toBe("Personal Training");
    });

    it("joins the labels of a list of predefined values", () => {
        const fields = [
            field("classTypes", "text", ["fitness", "personal-training"], { options: classTypes })
        ];

        expect(resolveItemTitle(fields, 0, "Item #1", "classTypes", [])).toBe(
            "Fitness, Personal Training"
        );
    });

    it("matches a numeric predefined value", () => {
        const fields = [
            field("size", "number", 2, {
                options: [
                    { label: "Small", value: 1 },
                    { label: "Large", value: 2 }
                ]
            })
        ];

        expect(resolveItemTitle(fields, 0, "Item #1", "size", [])).toBe("Large");
    });

    it("hands the value to the formatter registered for the field's type", () => {
        const formatter: IFieldValueFormatter = {
            type: "ref",
            format: f => (f.value === null ? undefined : "Baker")
        };
        const fields = [field("location", "ref", { id: "baker#0001", modelId: "location" })];

        expect(resolveItemTitle(fields, 0, "Item #1", "location", [formatter])).toBe("Baker");
        expect(resolveItemDescription(fields, 0, "location", [formatter])).toBe("Baker");
    });

    it("falls back while a value has no readable text", () => {
        const loading: IFieldValueFormatter = { type: "ref", format: () => undefined };
        const fields = [
            field("location", "ref", { id: "baker#0001", modelId: "location" }),
            field("details", "object", { a: 1 })
        ];

        expect(resolveItemTitle(fields, 2, "Facility #3", "location", [loading])).toBe(
            "Facility #3"
        );
        expect(resolveItemTitle(fields, 2, "Facility #3", "details", [])).toBe("Facility #3");
        expect(resolveItemDescription(fields, 2, "location", [loading])).toBeUndefined();
    });

    it("passes raw values to a title function", () => {
        const fields = [field("classType", "text", "fitness", { options: classTypes })];

        expect(
            resolveItemTitle(
                fields,
                1,
                "Item #2",
                (data, index) => `${data.classType} ${index}`,
                []
            )
        ).toBe("fitness 1");
    });
});
