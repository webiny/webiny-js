import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
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

const GET_FOLDER_MODEL = /* GraphQL */ `
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
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute() {
        const response = await this.client.execute<GetFolderModelResponse>({
            query: GET_FOLDER_MODEL
        });

        const { data, error } = response.aco.getFolderModel;

        if (!data) {
            throw new Error(error?.message || "Could not fetch folder model");
        }

        return data;
    }
}

export const GetFolderModelGqlGateway = GatewayAbstraction.createImplementation({
    implementation: GetFolderModelGqlGatewayImpl,
    dependencies: [MainGraphQLClient]
});
