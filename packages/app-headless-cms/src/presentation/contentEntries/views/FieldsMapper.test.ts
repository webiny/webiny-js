import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { FieldsMapper } from "./FieldsMapper.js";

const model = {
    modelId: "class",
    fields: [{ id: "f1", fieldId: "title", type: "text", label: "Title", settings: {} }]
} as unknown as CmsModel;

describe("FieldsMapper", () => {
    it("offers no Author filter when there are no authors to pick from", () => {
        const ids = FieldsMapper.toRaw(model).map(field => field.id);

        expect(ids).not.toContain("createdBy");
    });

    it("offers an Author filter with the authors as predefined values", () => {
        const fields = FieldsMapper.toRaw(model, [
            { id: "user-2", displayName: "Zoe Smith" },
            { id: "user-1", displayName: "Adam Jones" }
        ]);

        const author = fields.find(field => field.id === "createdBy");

        expect(author).toMatchObject({
            type: "text",
            label: "Author",
            predefinedValues: {
                enabled: true,
                values: [
                    { label: "Adam Jones", value: "user-1" },
                    { label: "Zoe Smith", value: "user-2" }
                ]
            }
        });
        expect(fields.map(field => field.label)).toEqual([
            "Author",
            "Created on",
            "Modified on",
            "Status",
            "Title"
        ]);
    });
});
