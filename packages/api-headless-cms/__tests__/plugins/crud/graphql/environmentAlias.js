const DATA_FIELD = /* GraphQL*/ `
    {
        id
        name
        slug
        description
        createdOn
        changedOn
        environment {
	        id
	        name
	        slug
	        description
	        createdOn
	        changedOn
	        createdFrom {
	            id
	            name
	            slug
	            description
	            createdOn
	            changedOn
	        }
        }
    }
`;
const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const CREATE_ENVIRONMENT_ALIAS_QUERY = /* GraphQL */ `
    mutation CreateEnvironmentAlias($data: CmsEnvironmentAliasInput!) {
        cms {
            createEnvironmentAlias(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
export const GET_ENVIRONMENT_ALIAS_QUERY = /* GraphQL */ `
    query GetEnvironmentAlias($id: ID!) {
        cms {
            getEnvironmentAlias(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
export const UPDATE_ENVIRONMENT_ALIAS_QUERY = /* GraphQL */ `
    mutation UpdateEnvironmentAlias($id: ID!, $data: CmsEnvironmentAliasInput!) {
        cms {
            updateEnvironmentAlias(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
export const DELETE_ENVIRONMENT_ALIAS_QUERY = /* GraphQL */ `
    mutation DeleteEnvironmentAlias($id: ID!) {
        cms {
            updateEnvironmentAlias(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
export const LIST_ENVIRONMENT_ALIAS_QUERY = /* GraphQL */ `
    query ListEnvironmentAlias() {
        cms {
            listEnvironmentAlias {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
