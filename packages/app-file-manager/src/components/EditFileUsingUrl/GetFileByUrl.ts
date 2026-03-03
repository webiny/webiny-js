import type { ApolloClient } from "@apollo/client";
import type { DocumentNode } from "graphql";
import type { FileItem } from "~/types.js";
import type { IGetFileByUrl } from "./EditFileUsingUrlRepository.js";
import { getFileByUrlQuery } from "./getFileByUrl.graphql.js";
import type { useFileModel } from "~/hooks/useFileModel.js";

export class GetFileByUrl implements IGetFileByUrl {
    private client: ApolloClient;
    private readonly query: DocumentNode;

    constructor(client: ApolloClient, model: ReturnType<typeof useFileModel>) {
        this.client = client;
        this.query = getFileByUrlQuery(model);
    }

    async execute(url: string): Promise<FileItem> {
        // TODO: add query type
        const response = await this.client.query({
            query: this.query,
            variables: { url },
            fetchPolicy: "network-only"
        });

        const { data, error } = response.data.fileManager.getFileByUrl;
        if (error) {
            throw new Error(error.message);
        }

        return data;
    }
}
