import { ApolloClient } from "apollo-client";
import { IUpdateFolderGateway } from "./IUpdateFolderGateway";
import { UpdateFolderFtaResponse, UpdateFolderFtaVariables } from "~/types";
import { UPDATE_FOLDER } from "~/graphql/folders.gql";
import { FolderDTO } from "~/Domain/Models";

export class UpdateFolderGraphQLGateway implements IUpdateFolderGateway {
    private client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    async execute(folder: FolderDTO) {
        const { id, title, slug, permissions, parentId } = folder;

        const { data: response } = await this.client.mutate<
            UpdateFolderFtaResponse,
            UpdateFolderFtaVariables
        >({
            mutation: UPDATE_FOLDER,
            variables: {
                id,
                data: {
                    title,
                    slug,
                    permissions,
                    parentId
                }
            }
        });

        if (!response) {
            throw new Error("Network error while updating folder.");
        }

        const { data, error } = response.aco.updateFolder;

        if (!data) {
            throw new Error(error?.message || "Could not update folder");
        }

        return data;
    }
}
