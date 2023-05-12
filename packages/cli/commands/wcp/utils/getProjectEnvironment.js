const { localStorage, log } = require("@webiny/cli/utils");
const { request } = require("graphql-request");
const { getWcpGqlApiUrl } = require("@webiny/wcp");

const ENVIRONMENT_FIELDS = /* GraphQL */ `
    fragment EnvironmentFields on Environment {
        id
        status
        name
        apiKey
        org {
            id
            name
        }
        project {
            id
            name
        }
        user {
            id
            email
        }
    }
`;

const CREATE_ENVIRONMENT = /* GraphQL */ `
    ${ENVIRONMENT_FIELDS}
    mutation CreateEnvironment(
        $orgId: ID!
        $projectId: ID!
        $userId: ID
        $data: CreateEnvironmentDataInput!
    ) {
        projects {
            createEnvironment(orgId: $orgId, projectId: $projectId, userId: $userId, data: $data) {
                ...EnvironmentFields
            }
        }
    }
`;

const GET_ENVIRONMENT = /* GraphQL */ `
    ${ENVIRONMENT_FIELDS}
    query GetEnvironment(
        $environmentId: ID
        $orgId: ID
        $projectId: ID
        $userId: ID
        $apiKey: String
    ) {
        projects {
            getEnvironment(
                environmentId: $environmentId
                orgId: $orgId
                projectId: $projectId
                userId: $userId
                apiKey: $apiKey
            ) {
                ...EnvironmentFields
            }
        }
    }
`;

module.exports.getProjectEnvironment = async ({
    orgId,
    projectId,
    userId,
    environmentId,
    apiKey
}) => {
    if (apiKey) {
        return request(getWcpGqlApiUrl(), GET_ENVIRONMENT, { apiKey })
            .then(response => response.projects.getEnvironment)
            .catch(() => {
                throw new Error(
                    `It seems the API key you provided is incorrect or disabled. Please double check the API key and try again.`
                );
            });
    }

    const pat = localStorage().get("wcpPat");
    if (!pat) {
        throw new Error(
            `It seems you are not logged in. Please login using the ${log.error.hl(
                "webiny login"
            )} command.`
        );
    }

    const headers = { authorization: pat };
    return request(
        getWcpGqlApiUrl(),
        GET_ENVIRONMENT,
        {
            orgId,
            projectId,
            userId,
            environmentId,
            apiKey
        },
        headers
    )
        .then(async response => response.projects.getEnvironment)
        .catch(() => {
            return request(
                getWcpGqlApiUrl(),
                CREATE_ENVIRONMENT,
                {
                    orgId,
                    projectId,
                    userId,
                    data: {
                        name: environmentId
                    }
                },
                headers
            ).then(async response => response.projects.createEnvironment);
        });
};
