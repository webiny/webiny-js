import gql from "graphql-tag";

export const LIST_TARGET_DATA_MODELS = gql`
    query ListTargetDataModels($sort: TargetDataModelsListSort, $limit: Int, $after: String, $before: String) {
        targetDataModels {
            listTargetDataModels(sort: $sort, limit: $limit, after: $after, before: $before) {
                data {
                    id
                    title
                    description
                    createdOn
                    savedOn
                    createdBy {
                        id
                        displayName
                        type
                    }
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
    mutation CreateTargetDataModel($data: TargetDataModelCreateInput!) {
        targetDataModels {
            createTargetDataModel(data: $data) {
                id
                title
                description
                createdOn
                savedOn
                createdBy {
                    id
                    displayName
                    type
                }
            }
        }
    }
`;

export const GET_TARGET_DATA_MODEL = gql`
    query GetTargetDataModel($id: ID!) {
        targetDataModels {
            getTargetDataModel(id: $id) {
                id
                title
                description
                createdOn
                savedOn
                createdBy {
                    id
                    displayName
                    type
                }
            }
        }
    }
`;

export const DELETE_TARGET_DATA_MODEL = gql`
    mutation DeleteTargetDataModel($id: ID!) {
        targetDataModels {
            deleteTargetDataModel(id: $id) {
                id
                title
                description
                createdOn
                savedOn
                createdBy {
                    id
                    displayName
                    type
                }
            }
        }
    }
`;

export const UPDATE_TARGET_DATA_MODEL = gql`
    mutation UpdateTargetDataModel($id: ID!, $data: TargetDataModelUpdateInput!) {
        targetDataModels {
            updateTargetDataModel(id: $id, data: $data) {
                id
                title
                description
                createdOn
                savedOn
                createdBy {
                    id
                    displayName
                    type
                }
            }
        }
    }
`;
