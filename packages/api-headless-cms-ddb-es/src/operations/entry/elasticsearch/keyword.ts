import { ModelField } from "./types";

const noKeywordFields: string[] = ["date", "datetime", "number", "boolean"];
export const hasKeyword = (field: ModelField): boolean => {
    /**
     * We defined some field types that MUST have no keyword added to the field path
     */
    if (noKeywordFields.includes(field.type)) {
        return false;
    }
    /**
     * If field has unmapped type defined, do not add keyword.
     */
    //
    else if (field.unmappedType) {
        return false;
    }
    /**
     * And if specifically defined that field has no keyword, do not add it.
     */
    //
    else if (field.keyword === false) {
        return false;
    }
    /**
     * All other fields have keyword added.
     */
    return true;
};
