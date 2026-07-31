import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import {
    ListCustomIconsGateway as Abstraction,
    type IListCustomIconsGateway,
    type ICustomIcon
} from "./abstractions.js";

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

interface ListCustomIconsError {
    message: string;
    data: Record<string, any>;
    code: string;
}

interface ListFilesEnvelope {
    data: CustomIconFile[] | null;
    error: ListCustomIconsError | null;
}

interface ListCustomIconsResponse {
    fileManager: {
        listFiles: ListFilesEnvelope;
    };
}

class ListCustomIconsGatewayImpl implements IListCustomIconsGateway {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<ICustomIcon[]> {
        const response = await this.client.execute<ListCustomIconsResponse>({
            query: LIST_CUSTOM_ICONS,
            variables: { limit: 10000 }
        });

        const { data, error } = response.fileManager.listFiles;

        if (!data) {
            throw new Error(error?.message || "Could not fetch custom icons.");
        }

        return data.map(icon => ({
            type: "custom" as const,
            name: icon.name,
            value: icon.src
        }));
    }
}

export const ListCustomIconsGateway = Abstraction.createImplementation({
    implementation: ListCustomIconsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
