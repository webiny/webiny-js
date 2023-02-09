import { validateModelFields } from "~/crud/contentModel/validateModelFields";
import { PluginsContainer } from "@webiny/plugins";
import { createGraphQLFields } from "~/graphqlFields";
import { CmsModel } from "~/types";
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

const createPluginsContainer = () => {
    return new PluginsContainer([createGraphQLFields()]);
};

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
    let plugins: PluginsContainer;
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
        plugins = createPluginsContainer();
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
        expect(() => {
            validateModelFields({
                model: createModel(),
                plugins
            });
        }).not.toThrowError();
    });

    it("should pass validation because everything is ok - new model", async () => {
        expect(() => {
            validateModelFields({
                model: createModel(),
                plugins
            });
        }).not.toThrowError();
    });

    it("should pass validation because everything is ok - updating model", async () => {
        expect(() => {
            validateModelFields({
                model: createModel({
                    fields: [textField],
                    layout: [[textField.id]]
                }),
                original: createModel({
                    fields: [textField, numberField],
                    layout: [[textField.id], [numberField.id]]
                }),
                plugins
            });
        }).not.toThrowError();
    });

    it("should throw an error if any of the fields type does not have the plugin equivalent", async () => {
        expect(() => {
            validateModelFields({
                model: createModel({
                    fields: [textField],
                    layout: [[textField.id]]
                }),
                plugins: new PluginsContainer()
            });
        }).toThrowError(
            new Error(
                `Cannot update content model because of the unknown "${textField.type}" field.`
            )
        );
    });

    it("should throw an error if any of the fields does not have a valid fieldId", async () => {
        expect(() => {
            validateModelFields({
                model: createModel({
                    fields: [textFieldWithoutFieldId],
                    layout: [[textFieldWithoutFieldId.id]]
                }),
                plugins
            });
        }).toThrowError(
            new WebinyError(`Field does not have an "fieldId" defined.`, "MISSING_FIELD_ID", {
                field: textFieldWithoutFieldId
            })
        );
    });

    it("should throw an error when having two fields with the same id", async () => {
        expect(() => {
            validateModelFields({
                model: createModel({
                    fields: [textField, textFieldWithDuplicatedId],
                    layout: [[textField.id], [textFieldWithDuplicatedId.id]]
                }),
                plugins
            });
        }).toThrowError(
            new WebinyError(
                `Cannot update content model because field "${
                    textFieldWithDuplicatedId.storageId || textFieldWithDuplicatedId.fieldId
                }" has id "${textFieldWithDuplicatedId.id}", which is already used.`
            )
        );
    });

    it("should throw an error when having two fields with the same fieldId", async () => {
        expect(() => {
            validateModelFields({
                model: createModel({
                    fields: [textField, textFieldWithDuplicatedFieldId],
                    layout: [[textField.id], [textFieldWithDuplicatedFieldId.id]]
                }),
                plugins
            });
        }).toThrowError(
            new WebinyError(
                `Cannot update content model because field "${textFieldWithDuplicatedFieldId.storageId}" has fieldId "${textFieldWithDuplicatedFieldId.fieldId}", which is already used.`
            )
        );
    });

    it("should throw an error when having two fields with the same storageId", async () => {
        expect(() => {
            validateModelFields({
                model: createModel({
                    fields: [textField, textFieldWithDuplicatedStorageId],
                    layout: [[textField.id], [textFieldWithDuplicatedStorageId.id]]
                }),
                plugins
            });
        }).toThrowError(
            new WebinyError(
                `Cannot update content model because field "${textFieldWithDuplicatedStorageId.label}" has storageId "${textFieldWithDuplicatedStorageId.storageId}", which is already used.`
            )
        );
    });

    it("should assign fieldId to the storageId on locked field", async () => {
        validateModelFields({
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
            }),
            plugins
        });

        expect(textFieldWithoutStorageId.storageId).toEqual(textFieldWithoutStorageId.fieldId);
    });

    it("should assign original field storageId to an updated one", async () => {
        const field: any = {
            ...textField,
            storageId: null
        };
        validateModelFields({
            model: createModel({
                fields: [field],
                layout: [[field.id]]
            }),
            original: createModel({
                fields: [textField],
                layout: [[textField.id]]
            }),
            plugins
        });

        expect(field.storageId).toEqual(textField.storageId);
    });

    it("should assign a new storageId to field without the storageId", async () => {
        const field: any = {
            ...textField,
            storageId: null
        };
        validateModelFields({
            model: createModel({
                fields: [field],
                layout: [[field.id]]
            }),
            plugins
        });

        expect(field.storageId).toEqual(`text@${field.id}`);
    });

    it("should validate children if the field has children", async () => {
        const field = createObjectField();
        expect(() => {
            validateModelFields({
                model: createModel({
                    fields: [field],
                    layout: [[field.id]]
                }),
                plugins
            });
        }).not.toThrowError();
    });
});
