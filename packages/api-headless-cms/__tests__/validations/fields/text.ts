import { FieldFactory } from "./types";

const createFieldFactory: FieldFactory = base => {
    return field => {
        return {
            id: "textFieldId",
            label: "Text field",
            type: "text",
            storageId: "text@textFieldId",
            fieldId: "textField",
            multipleValues: false,
            ...base,
            ...field
        };
    };
};

export const createTextField = createFieldFactory();
export const createTextFieldWithDuplicateId = createFieldFactory({
    label: "Text field 2",
    storageId: "",
    fieldId: "sameIdTextField"
});
export const createTextFieldWithDuplicateFieldId = createFieldFactory({
    id: "anotherTextFieldId",
    label: "Text field duplicated",
    storageId: "text@textFieldStorageId"
});
export const createTextFieldWithDuplicatedStorageId = createFieldFactory({
    id: "anotherTextFieldId",
    label: "Text field duplicated",
    fieldId: "textFieldNotDuplicate"
});
export const createTextFieldWithoutFieldId = createFieldFactory({
    id: "fieldWithoutFieldId",
    label: "Field without fieldId",
    storageId: "text@fieldWithoutFieldId",
    fieldId: ""
});
export const createTextFieldWithoutStorageId = createFieldFactory({
    id: "fieldWithoutStorageId",
    label: "Field without storageId",
    storageId: "",
    fieldId: "fieldWithoutStorageId"
});
