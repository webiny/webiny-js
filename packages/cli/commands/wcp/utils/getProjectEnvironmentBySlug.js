const { localStorage, log } = require("@webiny/cli/utils");
const { request } = require("graphql-request");

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

module.exports.getProjectEnvironmentBySlug = async ({
    orgId,
    projectId,
    userId,
    environmentSlug
}) => {
    const pat = localStorage().get("wcpPat");
    if (!pat) {
        throw new Error(
            `It seems you are not logged in. Please login using the ${log.error.hl(
                "webiny login"
            )} command.`
        );
    }

    const { WCP_API_URL } = require(".");
    const headers = { authorization: pat };
    return request(
        WCP_API_URL,
        GET_ENVIRONMENT,
        {
            orgId,
            projectId,
            userId,
            environmentId: environmentSlug
        },
        headers
    )
        .then(async response => response.projects.getEnvironment)
        .catch(() => {
            return request(
                WCP_API_URL,
                CREATE_ENVIRONMENT,
                {
                    orgId,
                    projectId,
                    userId,
                    data: {
                        name: environmentSlug
                    }
                },
                headers
            ).then(async response => response.projects.createEnvironment);
        });
};
