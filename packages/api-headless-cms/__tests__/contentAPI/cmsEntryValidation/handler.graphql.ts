import { CmsApiModel } from "~/plugins";

const fields = /* GraphQL */ `
    id
    entryId
    savedOn
    createdOn
    createdBy {
        id
        displayName
        type
    }
    meta {
        title
        version
    }
`;

const ERROR = `
error {
    message
    data
    code
    stack
}
`;

export const validateMutation = (model: Pick<CmsApiModel, "singularApiName">) => {
    return /* GraphQL */ `
        mutation ValidateProduct($revision: ID, $data: ${model.singularApiName}Input!) {
            validate: validate${model.singularApiName}(revision: $revision, data: $data) {
                data {
                    id
                    fieldId
                    error
                    parents
                }
                ${ERROR}
            }
        }
    `;
};

export const createMutation = (model: Pick<CmsApiModel, "singularApiName">) => {
    return /* GraphQL */ `
        mutation CreateProduct($data: ${model.singularApiName}Input!, $options: CreateCmsEntryOptionsInput) {
            create: create${model.singularApiName}(data: $data, options: $options) {
                data {
                    ${fields}
                }
                ${ERROR}
            }
        }
    `;
};

export const createRevisionMutation = (model: Pick<CmsApiModel, "singularApiName">) => {
    return /* GraphQL */ `
        mutation CreateProductFrom($revision: ID!, $options: CreateRevisionCmsEntryOptionsInput) {
            createRevision: create${model.singularApiName}From(revision: $revision, options: $options) {
                data {
                    ${fields}
                }
                ${ERROR}
            }
        }
    `;
};

export const updateMutation = (model: Pick<CmsApiModel, "singularApiName">) => {
    return /* GraphQL */ `
        mutation UpdateProduct($revision: ID!, $data: ${model.singularApiName}Input!, $options: UpdateCmsEntryOptionsInput) {
            update: update${model.singularApiName}(revision: $revision, data: $data, options: $options) {
                data {
                    ${fields}
                }
                ${ERROR}
            }
        }
    `;
};

export const deleteMutation = (model: Pick<CmsApiModel, "singularApiName">) => {
    return /* GraphQL */ `
        mutation DeleteProduct($revision: ID!) {
            delete: delete${model.singularApiName}(revision: $revision) {
                data
                ${ERROR}
            }
        }
    `;
};

export const publishMutation = (model: Pick<CmsApiModel, "singularApiName">) => {
    return /* GraphQL */ `
        mutation UpdateProduct($revision: ID!) {
            publish: publish${model.singularApiName}(revision: $revision) {
                data {
                    ${fields}
                }
                ${ERROR}
            }
        }
    `;
};
