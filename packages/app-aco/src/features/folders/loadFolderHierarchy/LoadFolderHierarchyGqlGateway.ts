import gql from "graphql-tag";
import { GraphQLClient } from "@webiny/app/features/graphqlClient/index.js";
import type { FolderDto } from "~/domain/folder/FolderDto.js";
import { RootFolder } from "~/domain/folder/RootFolder.js";
import { FolderModelProvider } from "~/features/folders/abstractions.js";
import { LoadFolderHierarchyGateway as GatewayAbstraction } from "./abstractions.js";
import type { AcoError } from "~/types.js";

interface LoadFolderHierarchyResponseData {
    parents: FolderDto[];
    siblings: FolderDto[];
}

export interface LoadFolderHierarchyResponse {
    aco: {
        getFolderHierarchy: {
            data: LoadFolderHierarchyResponseData | null;
            error: AcoError | null;
        };
    };
}

export interface LoadFolderHierarchyQueryVariables {
    type: string;
    id: string;
}

export const LOAD_FOLDER_HIERARCHY = (FOLDER_FIELDS: string) => /* GraphQL*/ `
    query GetFolderHierarchy($type: String!, $id: ID!) {
        aco {
            getFolderHierarchy(type: $type, id: $id) {
                data {
                    parents ${FOLDER_FIELDS}
                    siblings ${FOLDER_FIELDS}
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

class LoadFolderHierarchyGqlGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: GraphQLClient.Interface,
        private folderModelProvider: FolderModelProvider.Interface
    ) {}

    async execute(type: string, id: string) {
        const fields = await this.folderModelProvider.getGraphQLSelection();

        const response = await this.client.execute<
            LoadFolderHierarchyResponse,
            LoadFolderHierarchyQueryVariables
        >({
            query: LOAD_FOLDER_HIERARCHY(fields),
            variables: {
                type,
                id
            }
        });

        if (!response) {
            throw new Error(
                `Network error while loading folder hierarchy for the provided type/id: ${type}/${id}.`
            );
        }

        const { data, error } = response.aco.getFolderHierarchy;

        if (!data) {
            throw new Error(
                error?.message ||
                    `Could not load folder hierarchy for the provided type/id: ${type}/${id}.`
            );
        }

        return {
            parents: [RootFolder.create(), ...data.parents],
            siblings: data.siblings
        };
    }
}

export const LoadFolderHierarchyGqlGateway = GatewayAbstraction.createImplementation({
    implementation: LoadFolderHierarchyGqlGatewayImpl,
    dependencies: [GraphQLClient, FolderModelProvider]
});
