import gql from "graphql-tag";
import { ApolloClient } from "@webiny/app-admin/features/apolloClient/abstraction.js";
import { FoldersContext } from "~/features/folders/abstractions.js";
import { GetFolderGateway as GatewayAbstraction } from "./abstractions.js";
import type { FolderItem, AcoError } from "~/types.js";

export interface GetFolderResponse {
    aco: {
        getFolder: {
            data: FolderItem | null;
            error: AcoError | null;
        };
    };
}

export interface GetFolderQueryVariables {
    id: string;
}

export const GET_FOLDER = (FOLDER_FIELDS: string) => gql`
    query GetFolder($id: ID!) {
        aco {
            getFolder(id: $id) {
                data ${FOLDER_FIELDS}
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;

class GetFolderGqlGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: ApolloClient.Interface,
        private foldersContext: FoldersContext.Interface
    ) {}

    async execute(id: string) {
        if (!id) {
            throw new Error("Folder `id` is mandatory");
        }

        const { data: response } = await this.client.query<
            GetFolderResponse,
            GetFolderQueryVariables
        >({
            query: GET_FOLDER(this.foldersContext.modelFields),
            variables: { id },
            fetchPolicy: "network-only"
        });

        if (!response) {
            throw new Error("Network error while fetch folder.");
        }

        const { data, error } = response.aco.getFolder;

        if (!data) {
            throw new Error(error?.message || `Could not fetch folder with id: ${id}`);
        }

        return data;
    }
}

export const GetFolderGqlGateway = GatewayAbstraction.createImplementation({
    implementation: GetFolderGqlGatewayImpl,
    dependencies: [ApolloClient, FoldersContext]
});
