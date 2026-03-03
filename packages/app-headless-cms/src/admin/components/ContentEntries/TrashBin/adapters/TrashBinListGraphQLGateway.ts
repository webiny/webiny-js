import type { ApolloClient } from "@apollo/client";
import type { ITrashBinListGateway } from "@webiny/app-trash-bin";
import type {
    CmsEntriesListQueryResponse,
    CmsEntriesListQueryVariables
} from "@webiny/app-headless-cms-common";
import { createListQuery } from "@webiny/app-headless-cms-common";
import type {
    CmsContentEntry,
    CmsMetaResponse,
    CmsModel
} from "@webiny/app-headless-cms-common/types/index.js";

export class TrashBinListGraphQLGateway implements ITrashBinListGateway<CmsContentEntry> {
    private client: ApolloClient;
    private model: CmsModel;

    constructor(client: ApolloClient, model: CmsModel) {
        this.client = client;
        this.model = model;
    }

    async execute(
        params: CmsEntriesListQueryVariables
    ): Promise<[CmsContentEntry[], CmsMetaResponse]> {
        const { data: response } = await this.client.query<
            CmsEntriesListQueryResponse,
            CmsEntriesListQueryVariables
        >({
            query: createListQuery(this.model, this.getFields(), true),
            variables: {
                ...params
            },
            fetchPolicy: "network-only"
        });

        if (!response) {
            throw new Error("Network error while listing deleted entries.");
        }

        const { data, error, meta } = response.content;

        if (!data && !meta) {
            throw new Error(error?.message || "Could not fetch deleted entries.");
        }

        return [data, meta];
    }

    private getFields() {
        return this.model.fields.filter(field => {
            return ["text", "number", "boolean", "file", "long-text", "ref", "datetime"].includes(
                field.type
            );
        });
    }
}
