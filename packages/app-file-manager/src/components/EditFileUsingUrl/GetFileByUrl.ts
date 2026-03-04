import type { ApolloClient } from "@apollo/client";
import type { DocumentNode } from "graphql";
import type { FileItem } from "~/types.js";
import type { IGetFileByUrl } from "./EditFileUsingUrlRepository.js";
import { getFileByUrlQuery, type IGetFileByUrlResponse } from "./getFileByUrl.graphql.js";
import type { useFileModel } from "~/hooks/useFileModel.js";

export class GetFileByUrl implements IGetFileByUrl {
    private client: ApolloClient;
    private readonly query: DocumentNode;

    public constructor(client: ApolloClient, model: ReturnType<typeof useFileModel>) {
        this.client = client;
        this.query = getFileByUrlQuery(model);
    }

    public async execute(url: string): Promise<FileItem> {
        const response = await this.client.query<IGetFileByUrlResponse>({
            query: this.query,
            variables: { url },
            fetchPolicy: "network-only"
        });

        if (!response.data?.fileManager?.getFileByUrl) {
            throw new Error("No data returned from the server.");
        }

        const { data, error } = response.data.fileManager.getFileByUrl;
        if (error) {
            throw new Error(error.message);
        } else if (!data) {
            throw new Error("File not found.");
        }

        return data;
    }
}
