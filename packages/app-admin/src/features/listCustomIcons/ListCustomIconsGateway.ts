import { ListCustomIconsGateway as GatewayAbstraction } from "./abstractions/index.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

const LIST_CUSTOM_ICONS = /* GraphQL */ `
    query ListCustomIcons($limit: Int!) {
        fileManager {
            listFiles(where: { tags_startsWith: "scope:iconPicker" }, limit: $limit) {
                data {
                    name
                    src
                    tags
                }
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;

interface CustomIconFile {
    name: string;
    src: string;
}

interface ListFilesError {
    code: string;
    message: string;
    data: any;
}

type ListCustomIconsResponse = {
    fileManager: {
        listFiles:
            | { data: CustomIconFile[]; error: null }
            | { data: null; error: ListFilesError };
    };
};

class ListCustomIconsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<GatewayAbstraction.Result> {
        const response = await this.client.execute<ListCustomIconsResponse>({
            query: LIST_CUSTOM_ICONS,
            variables: { limit: 10000 }
        });

        const { data, error } = response.fileManager.listFiles;

        if (!data) {
            throw new Error(error?.message || "Could not fetch custom icons.");
        }

        return data;
    }
}

export const ListCustomIconsGateway = GatewayAbstraction.createImplementation({
    implementation: ListCustomIconsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
