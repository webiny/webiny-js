import { CmsModel } from "@webiny/api-headless-cms/types";

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
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
            data {
                id
                entryId
                title
                wbyAco_location {
                    folderId
                }
            }
            error ${ERROR_FIELD}
        }
        }
    `;
};

export const UPDATE_ENTRY = (model: CmsModel) => {
    const Entry = model.singularApiName;

    return /* GraphQL */ `
        mutation Update${Entry}($revision: ID!, $data: ${Entry}Input!) {
            update${Entry}: update${Entry}(revision: $revision, data: $data) {
            data {
                id
                title
                wbyAco_location {
                    folderId
                }
            }
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

export const LIST_ENTRIES = (model: CmsModel) => {
    const Entry = model.singularApiName;
    const Entries = model.pluralApiName;

    return /* GraphQL */ `
        query List${Entries}(
        $where: ${Entry}ListWhereInput
        $sort: [${Entry}ListSorter]
        $limit: Int
        $after: String
        ) {
            list${Entries}: list${Entries}(where: $where, sort: $sort, limit: $limit, after: $after) {
            data {
                id
                title
                wbyAco_location {
                    folderId
                }
            }
            meta {
                cursor
                hasMoreItems
                totalCount
            }
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
            data {
                id
                title
                wbyAco_location {
                    folderId
                }
            }
            error ${ERROR_FIELD}
        }
        }
    `;
};
