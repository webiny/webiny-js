import ApolloClient from "apollo-client";
import { DocumentNode } from "graphql";
import { FileItem } from "@webiny/app-admin/types";
import { IGetFileByUrl } from "./EditFileUsingUrlRepository";
import { getFileByUrlQuery } from "./getFileByUrl.graphql";
import { useFileModel } from "~/hooks/useFileModel";

export class GetFileByUrl implements IGetFileByUrl {
    private client: ApolloClient<unknown>;
    private readonly query: DocumentNode;

    constructor(client: ApolloClient<unknown>, model: ReturnType<typeof useFileModel>) {
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
