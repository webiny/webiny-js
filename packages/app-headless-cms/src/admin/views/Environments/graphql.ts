import gql from "graphql-tag";

const fields = `
    id
    name
    slug
    description
    default
`;

export const LIST_ENVIRONMENTS = gql`
    query listEnvironments($where: JSON, $sort: JSON, $page: Int, $perPage: Int, $search: CmsSearchInput) {
        cmsManage {
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
                    slug
                    description
                    createdOn
                    setAsDefaultOn
                    default
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
        cmsManage {
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
        cmsManage {
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
        cmsManage {
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
        cmsManage {
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
