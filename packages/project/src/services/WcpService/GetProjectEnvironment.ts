import { LocalStorageService } from "~/abstractions/index.js";
import { WcpGqlClient } from "./WcpGqlClient.js";
import { fetchProjectEnvironmentByApiKey } from "./fetchProjectEnvironmentByApiKey.js";
import { IGetProjectEnvironmentParams } from "~/abstractions/services/WcpService.js";
import { IWcpEnvironmentDto } from "~/abstractions/models/index.js";
import { WcpEnvironmentModel } from "~/models/index.js";

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

export interface ICreateEnvironmentParams {
    projects: {
        createEnvironment: IWcpEnvironmentDto;
    };
}

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

export interface IGetEnvironmentResponse {
    projects: {
        getEnvironment: IWcpEnvironmentDto;
    };
}

export interface IGetProjectEnvironmentDi {
    localStorageService: LocalStorageService.Interface;
}

export class GetProjectEnvironment {
    di: IGetProjectEnvironmentDi;

    constructor(di: IGetProjectEnvironmentDi) {
        this.di = di;
    }

    async execute(params: IGetProjectEnvironmentParams): Promise<WcpEnvironmentModel> {
        const { localStorageService } = this.di;
        const { orgId, projectId, userId, environmentId, apiKey } = params;

        if (apiKey) {
            // The cacheable REST endpoint needs the org and project in its URL. When a caller has
            // them, try it first. Anything but a clean answer falls through to the GraphQL query
            // below, which keeps every failure reported exactly as it was before the endpoint
            // existed, and keeps working against a WCP that doesn't have the endpoint.
            if (orgId && projectId) {
                try {
                    const environment = await fetchProjectEnvironmentByApiKey({
                        apiKey,
                        orgId,
                        projectId
                    });

                    return WcpEnvironmentModel.fromDto(environment);
                } catch {
                    // Fall through to GraphQL.
                }
            }

            return WcpGqlClient.execute<IGetEnvironmentResponse>(GET_ENVIRONMENT, { apiKey })
                .then(response => WcpEnvironmentModel.fromDto(response.projects.getEnvironment))
                .catch(() => {
                    throw new Error(
                        `It seems the API key you provided is incorrect or disabled. Please double check the API key and try again.`
                    );
                });
        }

        const pat = localStorageService.get("wcpPat");
        if (!pat) {
            throw new Error(
                `It seems you are not logged in. Please login using the "webiny login" command.`
            );
        }

        const headers = { authorization: pat };
        return WcpGqlClient.execute<IGetEnvironmentResponse>(
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
            .then(async response => WcpEnvironmentModel.fromDto(response.projects.getEnvironment))
            .catch(() => {
                return WcpGqlClient.execute<ICreateEnvironmentParams>(
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
                ).then(response => response.projects.createEnvironment);
            });
    }
}
