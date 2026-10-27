import { describe, expect, it } from "vitest";
import type { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import { getModelSafeValidationMessage } from "~/features/target/getModelSafeValidationMessage.js";

const model = {
    fields: [
        {
            id: "age",
            storageId: "number@age",
            fieldId: "age",
            type: "number",
            label: "Age",
            validation: [
                { name: "gte", message: "Age must be 0 or more.", settings: { value: 0 } }
            ],
            listValidation: []
        },
        {
            id: "tags",
            storageId: "text@tags",
            fieldId: "tags",
            type: "text",
            label: "Tags",
            list: true,
            validation: [],
            listValidation: [{ name: "minLength", message: "Add at least one tag." }]
        },
        {
            id: "address",
            storageId: "object@address",
            fieldId: "address",
            type: "object",
            label: "Address",
            validation: [],
            listValidation: [],
            settings: {
                fields: [
                    {
                        id: "zip",
                        storageId: "number@zip",
                        fieldId: "zip",
                        type: "number",
                        label: "Zip",
                        validation: [{ name: "required", message: "Zip is required." }],
                        listValidation: []
                    }
                ]
            }
        }
    ] as CmsModelField[]
} as Pick<CmsModel, "fields">;

describe("getModelSafeValidationMessage", () => {
    it("forwards a message the field's own validator configured", () => {
        expect(getModelSafeValidationMessage(model, ["age"], "Age must be 0 or more.")).toBe(
            "Age must be 0 or more."
        );
    });

    it("forwards a configured list validation message and a nested field's message", () => {
        expect(getModelSafeValidationMessage(model, ["tags"], "Add at least one tag.")).toBe(
            "Add at least one tag."
        );
        expect(getModelSafeValidationMessage(model, ["address", "zip"], "Zip is required.")).toBe(
            "Zip is required."
        );
    });

    it("forwards the fixed datetime format and predefined value texts of the CMS", () => {
        const datetime =
            'Invalid dateTime format for field "joinedOn". Expected ISO 8601 dateTime.';
        const predefined = "Value sent does not match any of the available predefined values.";

        expect(getModelSafeValidationMessage(model, ["joinedOn"], datetime)).toBe(datetime);
        expect(getModelSafeValidationMessage(model, ["age"], predefined)).toBe(predefined);
    });

    it("hides a raw thrown message and an unregistered validator text", () => {
        expect(
            getModelSafeValidationMessage(model, ["age"], "connect ECONNREFUSED 10.0.0.5:9200")
        ).toBeNull();
        expect(
            getModelSafeValidationMessage(model, ["age"], 'There are no "gte" validators defined.')
        ).toBeNull();
    });

    it("hides another field's configured message and anything for an unknown path", () => {
        expect(
            getModelSafeValidationMessage(model, ["address", "zip"], "Age must be 0 or more.")
        ).toBeNull();
        expect(getModelSafeValidationMessage(model, ["nope"], "Age must be 0 or more.")).toBeNull();
        expect(
            getModelSafeValidationMessage(model, ["tags", "0", "x"], "Add at least one tag.")
        ).toBeNull();
    });

    it("hides an error that is not a string", () => {
        expect(getModelSafeValidationMessage(model, ["age"], undefined)).toBeNull();
        expect(getModelSafeValidationMessage(model, ["age"], { message: "x" })).toBeNull();
    });
});
