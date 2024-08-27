import { ApolloClient } from "apollo-client";
import { IUpdateFolderGateway } from "./IUpdateFolderGateway";
import { UPDATE_FOLDER } from "~/graphql/folders.gql";
import { UpdateFolderResponse, UpdateFolderVariables } from "~/types";
import { ROOT_FOLDER } from "~/constants";
import { UpdateFolderGraphQLDTO } from "./IUpdateFolderGraphQLMapper";

export class UpdateFolderGraphQLGateway implements IUpdateFolderGateway {
    private client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    async execute(folder: UpdateFolderGraphQLDTO) {
        const { id, title, slug, permissions, parentId } = folder;

        const { data: response } = await this.client.mutate<
            UpdateFolderResponse,
            UpdateFolderVariables
        >({
            mutation: UPDATE_FOLDER,
            variables: {
                id,
                data: {
                    title,
                    slug,
                    parentId: parentId === ROOT_FOLDER ? null : parentId,
                    permissions: permissions.filter(p => !p.inheritedFrom)
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
