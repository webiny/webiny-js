import type { CmsModelField } from "~/types/index.js";

const requiredValidationName = "required";

/**
 * Method creates single and multiple values fields.
 */
export const createGraphQLInputField = (field: CmsModelField, graphQlType: string): string => {
    const isRequired = (field.validation || []).some(validation => {
        return validation.name === requiredValidationName;
    });
    const singleRequired = isRequired ? "!" : "";
    if (!field.list) {
        return `${field.fieldId}: ${graphQlType}`;
    }

    return `${field.fieldId}: [${graphQlType}${singleRequired}]`;
};
