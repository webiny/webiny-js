import { useValidationManageHandler } from "./handler";
import { createModel, createValidationStructure } from "./mocks/structure";
import { CmsModelFieldInput } from "~/types";

interface FieldError {
    error: string;
    id: string;
    fieldId: string;
    storageId: string;
}

const createFieldErrors = (fields: Pick<CmsModelFieldInput, "id" | "fieldId" | "settings">[]) => {
    return fields.reduce<FieldError[]>((errors, field) => {
        if (field.settings?.fields?.length) {
            errors.push(...createFieldErrors(field.settings.fields));
            return errors;
        }
        errors.push({
            error: expect.any(String),
            id: field.id,
            fieldId: field.fieldId,
            storageId: expect.stringMatching(`@`)
        });

        return errors;
    }, []);
};

describe("content entry validation", () => {
    const manager = useValidationManageHandler({
        path: "manage/en-US",
        plugins: [createValidationStructure()]
    });

    const model = createModel();

    it("should return errors for invalid entry", async () => {
        const [response] = await manager.validate({
            data: {}
        });

        expect(response).toEqual({
            data: {
                validateProduct: {
                    data: createFieldErrors(model.fields),
                    error: null
                }
            }
        });
    });
});
