const DATA_FIELD = /* GraphQL*/ `
    {
        id
        name
        slug
        description
        createdOn
        changedOn
        createdBy
        environment {
	        id
	        name
	        slug
	        description
	        createdBy
        }
    }
`;
const ERROR_FIELD = /* GraphQL */ `
    {
        code
        message
    }
`;

export const CREATE_ENVIRONMENT_ALIAS_MUTATION = /* GraphQL */ `
    mutation CreateEnvironmentAliasMutation($data: CmsEnvironmentAliasInput!) {
        cms {
            createEnvironmentAlias(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
export const GET_ENVIRONMENT_ALIAS_QUERY = /* GraphQL */ `
    query GetEnvironmentAliasQuery($id: ID!) {
        cms {
            getEnvironmentAlias(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
export const UPDATE_ENVIRONMENT_ALIAS_MUTATION = /* GraphQL */ `
    mutation UpdateEnvironmentAliasMutation($id: ID!, $data: CmsEnvironmentAliasInput!) {
        cms {
            updateEnvironmentAlias(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
export const DELETE_ENVIRONMENT_ALIAS_MUTATION = /* GraphQL */ `
    mutation DeleteEnvironmentAliasMutation($id: ID!) {
        cms {
            deleteEnvironmentAlias(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;
export const LIST_ENVIRONMENT_ALIAS_QUERY = /* GraphQL */ `
    query ListEnvironmentAliasesQuery {
        cms {
            listEnvironmentAliases {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
