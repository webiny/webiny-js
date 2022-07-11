import { CmsModel } from "@webiny/api-headless-cms/types";
import lodash from "lodash";

const createModelTypeName = (model: CmsModel): string => {
    return lodash.upperFirst(lodash.camelCase(model.modelId));
};

const createErrorFields = (): string => {
    return /* GraphQL */ `
        error {
            message
            data
            code
        }
    `;
};

const createContentEntryFields = (model: CmsModel): string => {
    return ["id", "entryId", "meta { data version status }"]
        .concat(model.fields.map(field => field.fieldId))
        .join("\n");
};

export const contentEntryCreateMutationFactory = (model: CmsModel) => {
    const modelTypeName = createModelTypeName(model);

    return /* GraphQL */ `
        mutation CreateContentEntry${modelTypeName}Mutation($data: ${modelTypeName}Input!) {
            create${modelTypeName}(data: $data) {
                data {
                    ${createContentEntryFields(model)}
                }
                ${createErrorFields()}
            }
        }
    `;
};

export const contentEntryUpdateMutationFactory = (model: CmsModel) => {
    const modelTypeName = createModelTypeName(model);

    return /* GraphQL */ `
        mutation UpdateContentEntry${modelTypeName}Mutation($revision: ID!, $data: ${modelTypeName}Input!) {
            update${modelTypeName}(revision: $revision, data: $data) {
                data {
                    ${createContentEntryFields(model)}
                }
                ${createErrorFields()}
            }
        }
    `;
};

export const contentEntryCreateFromMutationFactory = (model: CmsModel) => {
    const modelTypeName = createModelTypeName(model);

    return /* GraphQL */ `
        mutation CreateFromContentEntry${modelTypeName}Mutation($revision: ID!, $data: ${modelTypeName}Input) {
            create${modelTypeName}From(revision: $revision, data: $data) {
                data {
                    ${createContentEntryFields(model)}
                }
                ${createErrorFields()}
            }
        }
    `;
};

export const contentEntryGetQueryFactory = (model: CmsModel) => {
    const modelTypeName = createModelTypeName(model);

    return /* GraphQL */ `
        query GetContentEntry${modelTypeName}Query($revision: ID!) {
            get${modelTypeName}(revision: $revision) {
                data {
                    ${createContentEntryFields(model)}
                }
                ${createErrorFields()}
            }
        }
    `;
};
