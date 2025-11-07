import type {
    IContentEntriesGateway,
    IContentEntriesGatewayResponse
} from "./abstractions/ContentEntriesGateway.js";
import type ApolloClient from "apollo-client";
import type { IGenericError } from "../types.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import type {
    IListCmsRevisionsResponse,
    IListCmsRevisionsVariables
} from "./graphql/contentEntries.js";
import { createContentEntriesGraphQL } from "./graphql/contentEntries.js";

interface IContentEntriesGatewayParams {
    client: ApolloClient<object>;
    model: Pick<CmsModel, "pluralApiName">;
}
export class ContentEntriesGateway implements IContentEntriesGateway {
    #client;
    #model;

    public constructor(params: IContentEntriesGatewayParams) {
        this.#client = params.client;
        this.#model = params.model;
    }

    public async list(revisions: string[]): Promise<IContentEntriesGatewayResponse> {
        try {
            const query = createContentEntriesGraphQL(this.#model);
            const result = await this.#client.query<
                IListCmsRevisionsResponse,
                IListCmsRevisionsVariables
            >({
                query,
                variables: {
                    revisions
                }
            });
            return {
                data: result.data?.entries?.data || [],
                error: result.data?.entries?.error || null
            };
        } catch (ex) {
            return {
                data: [],
                error: ex as IGenericError
            };
        }
    }
}
