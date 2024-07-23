import { CmsModelField } from "~/types";
import { getBaseFieldType } from "~/utils/getBaseFieldType";
import { getApplicableFieldById } from "./getApplicableFieldById";

const isFieldApplicable = (field: CmsModelField) => {
    return Boolean(
        getBaseFieldType(field) === "file" && !field.multipleValues && field.settings?.imagesOnly
    );
};

export const getContentModelImageFieldId = (
    fields: CmsModelField[],
    imageFieldId?: string | null
) => {
    if (fields.length === 0) {
        return null;
    }

    const target = getApplicableFieldById(fields, imageFieldId, isFieldApplicable);

    if (target) {
        return target.fieldId;
    }

    const imageField = fields.find(isFieldApplicable);
    return imageField ? imageField.fieldId : null;
};
