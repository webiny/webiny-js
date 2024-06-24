import { ApolloClient } from "apollo-client";
import { IListFoldersGateway } from "./IListFoldersGateway";
import { ListFoldersFtaResponse, ListFoldersQueryVariables } from "~/types";
import { LIST_FOLDERS } from "~/graphql/folders.gql";
import { ROOT_FOLDER } from "~/constants";

export class ListFoldersGraphQLGateway implements IListFoldersGateway {
    private client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    async execute(type: string) {
        const { data: response } = await this.client.query<
            ListFoldersFtaResponse,
            ListFoldersQueryVariables
        >({
            query: LIST_FOLDERS,
            variables: {
                type,
                limit: 10000
            },
            fetchPolicy: "network-only"
        });

        if (!response) {
            throw new Error("Network error while listing folders.");
        }

        const { data, error } = response.aco.listFolders;

        if (!data) {
            throw new Error(error?.message || "Could not fetch folders");
        }

        return [this.getRootFolder(), ...(data || [])];
    }

    private getRootFolder() {
        return {
            id: ROOT_FOLDER,
            title: "Home",
            permissions: [],
            parentId: "0",
            slug: "",
            createdOn: "",
            createdBy: {
                id: "",
                displayName: "",
                type: ""
            },
            hasNonInheritedPermissions: false,
            canManagePermissions: true,
            canManageStructure: true,
            canManageContent: true,
            savedOn: "",
            savedBy: {
                id: "",
                displayName: "",
                type: ""
            },
            modifiedOn: null,
            modifiedBy: null,
            type: "$ROOT"
        };
    }
}
