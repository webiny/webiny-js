import { describe, expect, it } from "vitest";
import type { CmsModelField } from "~/types/index.js";
import { prepareDuplicateValues } from "~/features/contentEntry/DuplicateEntry/prepareDuplicateValues.js";

const createField = (fieldId: string, type: string): CmsModelField => {
    return {
        id: fieldId,
        fieldId,
        storageId: `${type}@${fieldId}`,
        type,
        label: fieldId
    } as CmsModelField;
};

describe("prepareDuplicateValues", () => {
    const fields = [
        createField("title", "text"),
        createField("slug", "text"),
        createField("amount", "number")
    ];

    it("should prefix the title field value", () => {
        const source = { title: "Apple", slug: "apple", amount: 5 };
        const result = prepareDuplicateValues({ titleFieldId: "title", fields }, source);

        expect(result).toEqual({ title: "Copy of Apple", slug: "apple", amount: 5 });
        expect(source).toEqual({ title: "Apple", slug: "apple", amount: 5 });
    });

    it("should not change values when title field is not a text field", () => {
        const source = { title: "Apple", slug: "apple", amount: 5 };
        const result = prepareDuplicateValues({ titleFieldId: "amount", fields }, source);

        expect(result).toEqual(source);
        expect(result).not.toBe(source);
    });

    it("should not change values when title is empty or missing", () => {
        expect(
            prepareDuplicateValues({ titleFieldId: "title", fields }, { title: "", slug: "a" })
        ).toEqual({ title: "", slug: "a" });
        expect(prepareDuplicateValues({ titleFieldId: "title", fields }, { slug: "a" })).toEqual({
            slug: "a"
        });
        expect(prepareDuplicateValues({ titleFieldId: "id", fields }, { title: "A" })).toEqual({
            title: "A"
        });
    });
});
