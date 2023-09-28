import { CmsModelField, CmsModelFieldValidation } from "~/types";

const requiredValidationName = "required";

const getIsRequired = (validations?: CmsModelFieldValidation[]): boolean => {
    return (validations || []).some(validation => {
        return validation.name === requiredValidationName;
    });
};

const envVars: string[] = [
    "HEADLESS_CMS_GRAPHQL_INPUT_REQUIRE_ARRAY_ITEM",
    "WEBINY_HEADLESS_CMS_GRAPHQL_INPUT_REQUIRE_ARRAY_ITEM"
];
/**
 * Method creates single and multiple values fields.
 */
export const createGraphQLInputField = (field: CmsModelField, graphQlType: string): string => {
    const singleRequired = getIsRequired(field.validation) ? "!" : "";
    if (!field.multipleValues) {
        return `${field.fieldId}: ${graphQlType}`;
    }

    const itemRequired = envVars.some(v => process.env[v] === "false") ? "" : singleRequired;

    return `${field.fieldId}: [${graphQlType}${itemRequired}]`;
};
