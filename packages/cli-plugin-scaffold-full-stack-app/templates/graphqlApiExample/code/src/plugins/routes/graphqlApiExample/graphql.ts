import gql from "graphql-tag";

// The same set of fields is being used on all query and mutation operations below.
export const TARGET_DATA_MODEL_FIELDS_FRAGMENT = /* GraphQL */ `
    fragment TargetDataModelFields on TargetDataModel {
        id
        title
        description
        createdOn
        savedOn
    }
`;

export const LIST_TARGET_DATA_MODELS = gql`
    ${TARGET_DATA_MODEL_FIELDS_FRAGMENT}
    query ListTargetDataModels(
        $sort: TargetDataModelsListSort
        $limit: Int
        $after: String
        $before: String
    ) {
        targetDataModels {
            listTargetDataModels(sort: $sort, limit: $limit, after: $after, before: $before) {
                data {
                    ...TargetDataModelFields
                }
                meta {
                    before
                    after
                    limit
                }
            }
        }
    }
`;

export const CREATE_TARGET_DATA_MODEL = gql`
    ${TARGET_DATA_MODEL_FIELDS_FRAGMENT}
    mutation CreateTargetDataModel($data: TargetDataModelCreateInput!) {
        targetDataModels {
            createTargetDataModel(data: $data) {
                ...TargetDataModelFields
            }
        }
    }
`;

export const DELETE_TARGET_DATA_MODEL = gql`
    ${TARGET_DATA_MODEL_FIELDS_FRAGMENT}
    mutation DeleteTargetDataModel($id: ID!) {
        targetDataModels {
            deleteTargetDataModel(id: $id) {
                ...TargetDataModelFields
            }
        }
    }
`;
