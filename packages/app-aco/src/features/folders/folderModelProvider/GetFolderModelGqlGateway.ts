import gql from "graphql-tag";
import { ApolloClient } from "@webiny/app-admin/features/apolloClient/abstraction.js";
import { GetFolderModelGateway as GatewayAbstraction } from "./abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import type { AcoError } from "~/types.js";

export interface GetFolderModelResponse {
    aco: {
        getFolderModel: {
            data: CmsModel;
            error: AcoError | null;
        };
    };
}

export const GET_FOLDER_MODEL = gql`
    query GetFolderModel {
        aco {
            getFolderModel {
                data
                error {
                    code
                    message
                    data
                    stack
                }
            }
        }
    }
`;

class GetFolderModelGqlGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: ApolloClient.Interface) {}

    async execute() {
        const { data: response } = await this.client.query<GetFolderModelResponse>({
            query: GET_FOLDER_MODEL,
            fetchPolicy: "network-only"
        });

        if (!response) {
            throw new Error("Network error while fetch folder.");
        }

        const { data, error } = response.aco.getFolderModel;

        if (!data) {
            throw new Error(error?.message || `Could not fetch folder model`);
        }

        return data;
    }
}

export const GetFolderModelGqlGateway = GatewayAbstraction.createImplementation({
    implementation: GetFolderModelGqlGatewayImpl,
    dependencies: [ApolloClient]
});
