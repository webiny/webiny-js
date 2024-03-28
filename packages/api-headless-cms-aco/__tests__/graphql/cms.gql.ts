import { CmsModel } from "@webiny/api-headless-cms/types";

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

const DATA_FIELD = /* GraphQL */ `
    {
        id
        entryId
        title
        wbyAco_location {
            folderId
        }
    }
`;

export const CREATE_CONTENT_MODEL = /* GraphQL */ `
    mutation CmsCreateContentModel($data: CmsContentModelCreateInput!) {
        createContentModel(data: $data) {
            data {
                modelId
                singularApiName
                pluralApiName
            }
            error ${ERROR_FIELD}
        }
    }
`;

export const CREATE_CONTENT_MODEL_GROUP = /* GraphQL */ `
    mutation CreateContentModelGroupMutation($data: CmsContentModelGroupInput!) {
        createContentModelGroup(data: $data) {
            data {
                id
                name
            }
            error ${ERROR_FIELD}
        }
    }
`;

export const CREATE_ENTRY = (model: CmsModel) => {
    const Entry = model.singularApiName;

    return /* GraphQL */ `
        mutation Create${Entry}($data: ${Entry}Input!) {
            create${Entry}: create${Entry}(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    `;
};

export const DELETE_ENTRY = (model: CmsModel) => {
    const Entry = model.singularApiName;

    return /* GraphQL */ `
        mutation Delete${Entry}($revision: ID!, $options: CmsDeleteEntryOptions) {
            delete${Entry}: delete${Entry}(revision: $revision, options: $options) {
                data
                error ${ERROR_FIELD}
            }
        }
    `;
};

export const RESTORE_ENTRY = (model: CmsModel) => {
    const Entry = model.singularApiName;

    return /* GraphQL */ `
        mutation Restore${Entry}($revision: ID!) {
            restore${Entry}: restore${Entry}(revision: $revision) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    `;
};

export const GET_ENTRY = (model: CmsModel) => {
    const Entry = model.singularApiName;

    return /* GraphQL */ `
        query Get${Entry}($revision: ID!) {
                get${Entry}: get${Entry}(revision: $revision) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    `;
};
