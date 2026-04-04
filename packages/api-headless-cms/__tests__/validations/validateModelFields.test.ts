import { beforeEach, describe, expect, it } from "vitest";
import type { CmsContext } from "~/types";
import {
    createTextField,
    createTextFieldWithDuplicatedStorageId,
    createTextFieldWithDuplicateFieldId,
    createTextFieldWithDuplicateId,
    createTextFieldWithoutFieldId
} from "./fields/text";
import type { CmsModelField } from "./fields/types";
import { createNumberField } from "~tests/validations/fields/number";
import { createObjectField } from "~tests/validations/fields/object";
import { useHandler } from "~tests/testHelpers/useHandler";
import { createTestModel as createModel } from "./models/test";
import { validateModelFields } from "~/domain/contentModel/validation/modelFields";
import { CmsModelFieldToGraphQLRegistry } from "~/features/graphql/index.js";

interface ErrorObject {
    message?: string;
    code?: string;
    data?: any;
    stack?: string;
}

const errorKeys = ["message", "code", "data", "stack"] as (keyof Error)[];
const extractError = (error?: Error | null) => {
    if (!error) {
        return undefined;
    }
    return errorKeys.reduce<ErrorObject>((result, key) => {
        if (!error[key]) {
            return result;
        }
        result[key as keyof ErrorObject] = error[key];
        return result;
    }, {});
};

describe("Validate model fields", () => {
    let context: CmsContext;
    /**
     * Text
     */
    let textField: CmsModelField;
    let textFieldWithoutFieldId: CmsModelField;
    let textFieldWithDuplicatedId: CmsModelField;
    let textFieldWithDuplicatedFieldId: CmsModelField;
    let textFieldWithDuplicatedStorageId: CmsModelField;
    /**
     * Number
     */
    let numberField: CmsModelField;

    beforeEach(async () => {
        const { handler, tenant } = useHandler({});
        context = await handler({
            path: "/cms/manage",
            headers: {
                "x-webiny-cms-endpoint": "manage",
                "x-tenant": tenant.id
            }
        });
        // text
        textField = createTextField();
        textFieldWithoutFieldId = createTextFieldWithoutFieldId();
        textFieldWithDuplicatedId = createTextFieldWithDuplicateId();
        textFieldWithDuplicatedFieldId = createTextFieldWithDuplicateFieldId();
        textFieldWithDuplicatedStorageId = createTextFieldWithDuplicatedStorageId();
        // number
        numberField = createNumberField();
    });

    it("should pass validation because there are no fields defined", async () => {
        let error: ErrorObject | undefined = undefined;

        try {
            await validateModelFields({
                context,
                models: [],
                model: createModel()
            });
        } catch (ex) {
            error = extractError(ex);
        }
        expect(error).toEqual(undefined);
    });

    it("should pass validation because everything is ok - new model", async () => {
        let error: ErrorObject | undefined = undefined;

        try {
            await validateModelFields({
                context,
                models: [],
                model: createModel()
            });
        } catch (ex) {
            error = extractError(ex);
        }

        expect(error).toEqual(undefined);
    });

    it("should pass validation because everything is ok - updating model", async () => {
        let error: ErrorObject | undefined = undefined;
        try {
            await validateModelFields({
                context,
                models: [],
                model: createModel({
                    fields: [textField],
                    layout: [[textField.id]]
                }),
                original: createModel({
                    fields: [textField, numberField],
                    layout: [[textField.id], [numberField.id]]
                })
            });
        } catch (ex) {
            error = extractError(ex);
        }
        expect(error).toEqual(undefined);
    });

    it("should throw an error if any of the fields type does not have the plugin equivalent", async () => {
        let error: ErrorObject | undefined = undefined;
        try {
            context.container.registerInstance(CmsModelFieldToGraphQLRegistry, {
                get: () => undefined,
                getAll: () => [],
                getAllAsPlugins: () => [],
                getAllAsPluginRecords: () => ({})
            });
            await validateModelFields({
                context,
                models: [],
                model: createModel({
                    fields: [textField],
                    layout: [[textField.id]]
                })
            });
        } catch (ex) {
            error = extractError(ex);
        }

        expect(error).toEqual({
            message: `Cannot update content model because of the unknown "${textField.type}" field.`,
            stack: expect.any(String)
        });
    });

    it("should throw an error if any of the fields does not have a valid fieldId", async () => {
        let error: ErrorObject | undefined = undefined;
        try {
            await validateModelFields({
                context,
                models: [],
                model: createModel({
                    fields: [textFieldWithoutFieldId],
                    layout: [[textFieldWithoutFieldId.id]]
                })
            });
        } catch (ex) {
            error = extractError(ex);
        }

        expect(error).toEqual({
            message: `Field does not have an "fieldId" defined.`,
            code: "MISSING_FIELD_ID",
            data: {
                field: textFieldWithoutFieldId
            },
            stack: expect.any(String)
        });
    });

    it("should throw an error when having two fields with the same id", async () => {
        let error: ErrorObject | undefined = undefined;

        try {
            await validateModelFields({
                context,
                models: [],
                model: createModel({
                    fields: [textField, textFieldWithDuplicatedId],
                    layout: [[textField.id], [textFieldWithDuplicatedId.id]]
                })
            });
        } catch (ex) {
            error = extractError(ex);
        }

        expect(error).toEqual({
            message: `Cannot update content model because field "${
                textFieldWithDuplicatedId.storageId || textFieldWithDuplicatedId.fieldId
            }" has id "${textFieldWithDuplicatedId.id}", which is already used.`,
            stack: expect.any(String)
        });
    });

    it("should throw an error when having two fields with the same fieldId", async () => {
        let error: ErrorObject | undefined = undefined;
        try {
            await validateModelFields({
                context,
                models: [],
                model: createModel({
                    fields: [textField, textFieldWithDuplicatedFieldId],
                    layout: [[textField.id], [textFieldWithDuplicatedFieldId.id]]
                })
            });
        } catch (ex) {
            error = extractError(ex);
        }
        expect(error).toEqual({
            message: `Cannot update content model because field "${textFieldWithDuplicatedFieldId.storageId}" has fieldId "${textFieldWithDuplicatedFieldId.fieldId}", which is already used.`,
            stack: expect.any(String)
        });
    });

    it("should throw an error when having two fields with the same storageId", async () => {
        let error: ErrorObject | undefined = undefined;
        try {
            await validateModelFields({
                context,
                models: [],
                model: createModel({
                    fields: [textField, textFieldWithDuplicatedStorageId],
                    layout: [[textField.id], [textFieldWithDuplicatedStorageId.id]]
                })
            });
        } catch (ex) {
            error = extractError(ex);
        }
        expect(error).toEqual({
            message: `Cannot update content model because field "${textFieldWithDuplicatedStorageId.label}" has storageId "${textFieldWithDuplicatedStorageId.storageId}", which is already used.`,
            stack: expect.any(String)
        });
    });

    it("should assign original field storageId to an updated one", async () => {
        const field: any = {
            ...textField,
            storageId: null
        };
        await validateModelFields({
            context,
            models: [],
            model: createModel({
                fields: [field],
                layout: [[field.id]]
            }),
            original: createModel({
                fields: [textField],
                layout: [[textField.id]]
            })
        });

        expect(field.storageId).toEqual(textField.storageId);
    });

    it("should assign a new storageId to field without the storageId", async () => {
        const field: any = {
            ...textField,
            storageId: null
        };
        await validateModelFields({
            context,
            models: [],
            model: createModel({
                fields: [field],
                layout: [[field.id]]
            })
        });

        expect(field.storageId).toEqual(`text@${field.id}`);
    });

    it("should validate children if the field has children - no error", async () => {
        const field = createObjectField();
        let error: ErrorObject | undefined = undefined;

        try {
            await validateModelFields({
                context,
                models: [],
                model: createModel({
                    fields: [field],
                    layout: [[field.id]]
                })
            });
        } catch (ex) {
            error = extractError(ex);
        }

        expect(error).toEqual(undefined);
    });

    it("should validate children if the field has children - error", async () => {
        const field = createObjectField({
            settings: {
                fields: [textField, textFieldWithDuplicatedFieldId],
                layout: [[textField.id], [textFieldWithDuplicatedFieldId.id]]
            }
        });
        let error: ErrorObject | undefined = undefined;

        try {
            await validateModelFields({
                context,
                models: [],
                model: createModel({
                    fields: [field],
                    layout: [[field.id]]
                })
            });
        } catch (ex) {
            error = extractError(ex);
        }

        expect(error).toEqual({
            message: `Cannot update content model because field "${textFieldWithDuplicatedFieldId.storageId}" has fieldId "${textFieldWithDuplicatedFieldId.fieldId}", which is already used.`,
            stack: expect.any(String)
        });
    });
});
