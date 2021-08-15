/**
 * Contains all of the GraphQL queries and mutations that we might need while writing our tests.
 * If needed, feel free to add more.
 */

export const GET_TARGET_DATA_MODEL = /* GraphQL */ `
    query GetTargetDataModel($id: ID!) {
        targetDataModels {
            getTargetDataModel(id: $id) {
                id
                title
                description
            }
        }
    }
`;

export const CREATE_TARGET_DATA_MODEL = /* GraphQL */ `
    mutation CreateTargetDataModel($data: TargetDataModelCreateInput!) {
        targetDataModels {
            createTargetDataModel(data: $data) {
                id
                title
                description
            }
        }
    }
`;

export const UPDATE_TARGET_DATA_MODEL = /* GraphQL*/ `
    mutation UpdateTargetDataModel($id: ID!, $data: TargetDataModelUpdateInput!) {
        targetDataModels {
            updateTargetDataModel(id: $id, data: $data) {
                id
                title
                description
            }
        }
    }
`;

export const DELETE_TARGET_DATA_MODEL = /* GraphQL */ `
    mutation DeleteTargetDataModel($id: ID!) {
        targetDataModels {
            deleteTargetDataModel(id: $id) {
                id
                title
                description
            }
        }
    }
`;

export const LIST_TARGET_DATA_MODELS = /* GraphQL */ `
    query ListTargetDataModels($sort: TargetDataModelsListSort, $limit: Int, $after: String) {
        targetDataModels {
            listTargetDataModels(sort: $sort, limit: $limit, after: $after) {
                data {
                    id
                    title
                    description
                }
                meta {
                    limit
                    after
                    before
                }
            }
        }
    }
`;
