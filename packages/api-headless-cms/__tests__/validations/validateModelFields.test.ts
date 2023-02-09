import { validateModelFields } from "~/crud/contentModel/validateModelFields";
import { PluginsContainer } from "@webiny/plugins";
import { CmsContext, CmsModel } from "~/types";
import WebinyError from "@webiny/error";
import {
    createTextField,
    createTextFieldWithDuplicatedStorageId,
    createTextFieldWithDuplicateFieldId,
    createTextFieldWithDuplicateId,
    createTextFieldWithoutFieldId,
    createTextFieldWithoutStorageId
} from "./fields/text";
import { CmsModelField } from "./fields/types";
import { createNumberField } from "~tests/validations/fields/number";
import { createObjectField } from "~tests/validations/fields/object";
import { useHandler } from "~tests/testHelpers/useHandler";

const createModel = (model: Partial<CmsModel> = {}): CmsModel => {
    return {
        modelId: "testingModel",
        name: "Testing Model",
        description: "Testing model description",
        fields: [],
        layout: [],
        titleFieldId: "id",
        tenant: "root",
        locale: "en-US",
        group: {
            id: "group",
            name: "Group"
        },
        webinyVersion: "x.x.x",
        ...model
    };
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
    let textFieldWithoutStorageId: CmsModelField;
    /**
     * Number
     */
    let numberField: CmsModelField;

    beforeEach(async () => {
        const { handler, tenant } = useHandler({});
        context = await handler({
            path: "/cms/manage/en-US",
            headers: {
                "x-webiny-cms-endpoint": "manage",
                "x-webiny-cms-locale": "en-US",
                "x-tenant": tenant.id
            }
        });
        // text
        textField = createTextField();
        textFieldWithoutFieldId = createTextFieldWithoutFieldId();
        textFieldWithDuplicatedId = createTextFieldWithDuplicateId();
        textFieldWithDuplicatedFieldId = createTextFieldWithDuplicateFieldId();
        textFieldWithDuplicatedStorageId = createTextFieldWithDuplicatedStorageId();
        textFieldWithoutStorageId = createTextFieldWithoutStorageId();
        // number
        numberField = createNumberField();
    });

    it("should pass validation because there are no fields defined", async () => {
        let error: Error | undefined = undefined;

        try {
            await validateModelFields({
                context,
                model: createModel()
            });
        } catch (ex) {
            error = ex;
        }
        expect(error).toEqual(undefined);
    });

    it("should pass validation because everything is ok - new model", async () => {
        let error: Error | undefined = undefined;

        try {
            await validateModelFields({
                context,
                model: createModel()
            });
        } catch (ex) {
            error = ex;
        }

        expect(error).toEqual(undefined);
    });

    it("should pass validation because everything is ok - updating model", async () => {
        let error: Error | undefined = undefined;
        try {
            await validateModelFields({
                context,
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
            error = ex;
        }
        expect(error).toEqual(undefined);
    });

    it("should throw an error if any of the fields type does not have the plugin equivalent", async () => {
        let error: Error | undefined = undefined;
        try {
            context.plugins = new PluginsContainer();
            const result = await validateModelFields({
                context,
                model: createModel({
                    fields: [textField],
                    layout: [[textField.id]]
                })
            });
            console.log(result);
        } catch (ex) {
            error = ex;
        }

        expect(error).toEqual(
            new Error(
                `Cannot update content model because of the unknown "${textField.type}" field.`
            )
        );
    });

    it("should throw an error if any of the fields does not have a valid fieldId", async () => {
        let error: Error | undefined = undefined;
        try {
            await validateModelFields({
                context,
                model: createModel({
                    fields: [textFieldWithoutFieldId],
                    layout: [[textFieldWithoutFieldId.id]]
                })
            });
        } catch (ex) {
            error = ex;
        }

        expect(error).toEqual(
            new WebinyError(`Field does not have an "fieldId" defined.`, "MISSING_FIELD_ID", {
                field: textFieldWithoutFieldId
            })
        );
    });

    it("should throw an error when having two fields with the same id", async () => {
        let error: Error | undefined = undefined;

        try {
            await validateModelFields({
                context,
                model: createModel({
                    fields: [textField, textFieldWithDuplicatedId],
                    layout: [[textField.id], [textFieldWithDuplicatedId.id]]
                })
            });
        } catch (ex) {
            error = ex;
        }

        expect(error).toEqual(
            new WebinyError(
                `Cannot update content model because field "${
                    textFieldWithDuplicatedId.storageId || textFieldWithDuplicatedId.fieldId
                }" has id "${textFieldWithDuplicatedId.id}", which is already used.`
            )
        );
    });

    it("should throw an error when having two fields with the same fieldId", async () => {
        let error: Error | undefined = undefined;
        try {
            await validateModelFields({
                context,
                model: createModel({
                    fields: [textField, textFieldWithDuplicatedFieldId],
                    layout: [[textField.id], [textFieldWithDuplicatedFieldId.id]]
                })
            });
        } catch (ex) {
            error = ex;
        }
        expect(error).toEqual(
            new WebinyError(
                `Cannot update content model because field "${textFieldWithDuplicatedFieldId.storageId}" has fieldId "${textFieldWithDuplicatedFieldId.fieldId}", which is already used.`
            )
        );
    });

    it("should throw an error when having two fields with the same storageId", async () => {
        let error: Error | undefined = undefined;
        try {
            await validateModelFields({
                context,
                model: createModel({
                    fields: [textField, textFieldWithDuplicatedStorageId],
                    layout: [[textField.id], [textFieldWithDuplicatedStorageId.id]]
                })
            });
        } catch (ex) {
            error = ex;
        }
        expect(error).toEqual(
            new WebinyError(
                `Cannot update content model because field "${textFieldWithDuplicatedStorageId.label}" has storageId "${textFieldWithDuplicatedStorageId.storageId}", which is already used.`
            )
        );
    });

    it("should assign fieldId to the storageId on locked field", async () => {
        await validateModelFields({
            context,
            model: createModel({
                fields: [textField, textFieldWithoutStorageId],
                layout: [[textField.id], [textFieldWithoutStorageId.id]],
                lockedFields: [
                    {
                        fieldId: textFieldWithoutStorageId.id,
                        multipleValues: textFieldWithoutStorageId.multipleValues,
                        type: textFieldWithoutStorageId.type
                    }
                ]
            })
        });

        expect(textFieldWithoutStorageId.storageId).toEqual(textFieldWithoutStorageId.fieldId);
    });

    it("should assign original field storageId to an updated one", async () => {
        const field: any = {
            ...textField,
            storageId: null
        };
        await validateModelFields({
            context,
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
            model: createModel({
                fields: [field],
                layout: [[field.id]]
            })
        });

        expect(field.storageId).toEqual(`text@${field.id}`);
    });

    it("should validate children if the field has children - no error", async () => {
        const field = createObjectField();
        let error: Error | undefined = undefined;

        try {
            await validateModelFields({
                context,
                model: createModel({
                    fields: [field],
                    layout: [[field.id]]
                })
            });
        } catch (ex) {
            error = ex;
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
        let error: Error | undefined = undefined;

        try {
            await validateModelFields({
                context,
                model: createModel({
                    fields: [field],
                    layout: [[field.id]]
                })
            });
        } catch (ex) {
            error = ex;
        }

        expect(error).toEqual(
            new WebinyError(
                `Cannot update content model because field "${textFieldWithDuplicatedFieldId.storageId}" has fieldId "${textFieldWithDuplicatedFieldId.fieldId}", which is already used.`
            )
        );
    });

    it("should throw an error if schema cannot be generated for a model - field exists in built-in type", async () => {
        const field = createTextField({
            fieldId: "status"
        });

        let error: Error | undefined;
        try {
            await validateModelFields({
                context,
                model: createModel({
                    fields: [field],
                    layout: [[field.id]]
                })
            });
        } catch (ex) {
            error = ex;
        }

        expect(error).toEqual(
            new WebinyError({
                message: `Model "testingModel" was not saved!\nSee more details in the browser console.`,
                code: "INVALID_MODEL_DEFINITION"
            })
        );
    });

    it("should throw an error if schema cannot be generated for a model - faulty object field", async () => {
        const field = createObjectField({
            settings: {
                fields: [],
                layout: []
            }
        });
        let error: Error | undefined;
        try {
            await validateModelFields({
                context,
                model: createModel({
                    fields: [field],
                    layout: [[field.id]]
                })
            });
        } catch (ex) {
            error = ex;
        }

        expect(error).toEqual(
            new WebinyError({
                message: `Model "testingModel" was not saved!\nPlease review the definition of "objectField" field.`,
                code: "INVALID_MODEL_DEFINITION",
                data: {
                    modelId: "testingModel",
                    invalidField: "objectField"
                }
            })
        );
    });
});
