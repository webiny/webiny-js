import gql from "graphql-tag";

const fields = `
    id
    name
    description
    createdFrom {
        id
        name
    }
`;

export const LIST_ENVIRONMENTS = gql`
    query listEnvironments(
        $where: JSON
        $sort: JSON
        $page: Int
        $perPage: Int
        $search: CmsSearchInput
    ) {
        cms {
            environments: listEnvironments(
                where: $where
                sort: $sort
                page: $page
                perPage: $perPage
                search: $search
            ) {
                data {
                    id
                    name
                    isProduction
                    createdOn
                    environmentAlias {
                        id
                        name
                    }
                }
                meta {
                    totalCount
                    totalPages
                    to
                    from
                    nextPage
                    previousPage
                }
            }
        }
    }
`;

export const READ_ENVIRONMENT = gql`
    query getEnvironment($id: ID!) {
        cms {
            environment: getEnvironment(id: $id){
                data {
                    ${fields}
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const CREATE_ENVIRONMENT = gql`
    mutation createEnvironment($data: CmsEnvironmentInput!){
        cms {
            environment: createEnvironment(data: $data) {
                data {
                    ${fields}
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

export const UPDATE_ENVIRONMENT = gql`
    mutation updateEnvironment($id: ID!, $data: CmsEnvironmentInput!){
        cms {
            environment: updateEnvironment(id: $id, data: $data) {
                data {
                    ${fields}
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

export const DELETE_ENVIRONMENT = gql`
    mutation deleteEnvironment($id: ID!) {
        cms {
            deleteEnvironment(id: $id) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;
