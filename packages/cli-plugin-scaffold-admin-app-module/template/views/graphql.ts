import gql from "graphql-tag";

export const LIST_ENTITIES = gql`
    query ListEntities(
        $sort: EntityListSort
        $sort: EntityListSort
        $where: EntityListWhere
        $limit: Int
        $after: String
        $before: String
    ) {
        entities {
            listEntities(
                sort: $sort
                where: $where
                limit: $limit
                after: $after
                before: $before
            ) {
                data {
                    id
                    title
                    description
                    isNice
                    createdOn
                }
            }
        }
    }
`;

export const CREATE_ENTITY = gql`
    mutation CreateEntity($input: EntityInput!) {
        createEntity(input: $input) {
            data {
                id
                title
                description
                isNice
                createdOn
            }
            error {
                code
                message
                data
            }
        }
    }
`;

export const READ_ENTITY = gql`
    query GetEntity($id: ID!) {
        entities {
            entity: getEntity(id: $id) {
                data {
                    id
                    title
                    description
                    isNice
                    createdOn
                }
            }
        }
    }
`;

export const DELETE_ENTITY = gql`
    mutation DeleteEntity($id: ID!) {
        deleteEntity(id: $id) {
            data
            error {
                code
                message
                data
            }
        }
    }
`;

export const UPDATE_ENTITY = gql`
    mutation UpdateEntity($id: ID!, $data: EntityInput!) {
        updateEntity(id: $id, data: $data) {
            data {
                id
                title
                description
                isNice
                createdOn
            }
            error {
                code
                message
                data
            }
        }
    }
`;
