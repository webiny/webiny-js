import gql from "graphql-tag";

export const LIST_TARGETS = gql`
    query ListTargets(
        $sort: [TargetListSort!]
        $where: TargetListWhereInput
        $limit: Int
        $after: String
    ) {
        targets {
            listTargets(sort: $sort, where: $where, limit: $limit, after: $after) {
                data {
                    id
                    title
                    description
                    isNice
                    createdOn
                    savedOn
                    createdBy {
                        id
                        displayName
                        type
                    }
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

export const CREATE_TARGET = gql`
    mutation CreateTarget($data: TargetCreateInput!) {
        targets {
            createTarget(data: $data) {
                data {
                    id
                    title
                    description
                    isNice
                    createdOn
                    savedOn
                    createdBy {
                        id
                        displayName
                        type
                    }
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

export const GET_TARGET = gql`
    query GetTarget($id: ID!) {
        targets {
            getTarget(id: $id) {
                data {
                    id
                    title
                    description
                    isNice
                    createdOn
                    savedOn
                    createdBy {
                        id
                        displayName
                        type
                    }
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

export const DELETE_TARGET = gql`
    mutation DeleteTarget($id: ID!) {
        targets {
            deleteTarget(id: $id) {
                data
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

export const UPDATE_TARGET = gql`
    mutation UpdateTarget($id: ID!, $data: TargetUpdateInput!) {
        targets {
            updateTarget(id: $id, data: $data) {
                data {
                    id
                    title
                    description
                    isNice
                    createdOn
                    savedOn
                    createdBy {
                        id
                        displayName
                        type
                    }
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;
