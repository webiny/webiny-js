import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { GetFileModelGateway as GatewayAbstraction } from "./abstractions.js";

interface GetFileModelResponse {
    fileManager: {
        getFileModel: {
            data: CmsModel;
            error: { code: string; message: string; data: unknown } | null;
        };
    };
}

const GET_FILE_MODEL = /* GraphQL */ `
    query GetFileModel {
        fileManager {
            getFileModel {
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

class GetFileModelGqlGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<CmsModel> {
        const response = await this.client.execute<GetFileModelResponse>({
            query: GET_FILE_MODEL
        });

        const { data, error } = response.fileManager.getFileModel;

        if (!data) {
            throw new Error(error?.message || "Could not fetch file model.");
        }

        return data;
    }
}

export const GetFileModelGqlGateway = GatewayAbstraction.createImplementation({
    implementation: GetFileModelGqlGatewayImpl,
    dependencies: [MainGraphQLClient]
});
