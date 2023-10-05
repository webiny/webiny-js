import { CmsModelField } from "~/types";
import ucFirst from "lodash/upperFirst";
import { createMinLengthValidation, createRequiredValidation } from "./validations";

export interface CreateFieldInput
    extends Pick<
        CmsModelField,
        "id" | "fieldId" | "type" | "label" | "listValidation" | "validation" | "multipleValues"
    > {
    parentId?: string;
}

export const createLayout = (fields: Pick<CmsModelField, "id" | "settings">[]) => {
    return fields.reduce<string[][]>((layout, field) => {
        layout.push([field.id]);
        // object
        if (field.settings?.fields?.length) {
            layout.push(...createLayout(field.settings.fields));
        }
        return layout;
    }, []);
};

export const createFieldId = (
    field: Pick<CmsModelField, "id" | "multipleValues">,
    parentId?: string
): string => {
    const list = [field.id];
    if (parentId) {
        list[0] = ucFirst(list[0]);
        list.unshift(parentId);
    }
    if (field.multipleValues) {
        list[0] = ucFirst(list[0]);
        list.unshift(`multiValue`);
    }
    return list.join("");
};
export const createFieldFieldId = (
    field: Pick<CmsModelField, "fieldId" | "multipleValues">,
    parentId?: string
): string => {
    const list = [field.fieldId];
    if (parentId) {
        list[0] = ucFirst(list[0]);
        list.unshift(parentId);
    }
    if (field.multipleValues) {
        list[0] = ucFirst(list[0]);
        list.unshift(`multiValue`);
    }
    return list.join("");
};

export interface CreateFieldCb {
    (input: Partial<CmsModelField> & CreateFieldInput): CmsModelField;
}

export const createField: CreateFieldCb = input => {
    const { parentId, ...field } = input;
    const id = createFieldId(field, parentId);
    const fieldId = createFieldFieldId(field, parentId);
    const result: Omit<CmsModelField, "storageId"> = {
        ...field,
        validation: [createRequiredValidation(), ...(field.validation || [])],
        listValidation: [
            createRequiredValidation(),
            createMinLengthValidation(1),
            ...(field.listValidation || [])
        ],
        id,
        fieldId,
        helpText: `Helper text for ${input.label}`,
        placeholderText: `A ${input.label} value`
    };
    return result as CmsModelField;
};
