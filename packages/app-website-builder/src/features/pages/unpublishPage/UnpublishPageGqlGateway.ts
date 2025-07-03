import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { IUnpublishPageGateway } from "./IUnpublishPageGateway.js";
import type { WbError } from "~/types.js";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";

export interface UnpublishPageVariables {
    id: string;
}

export interface UnpublishPageResponse {
    websiteBuilder: {
        unpublishPage: {
            data: PageGatewayDto | null;
            error: WbError | null;
        };
    };
}

export const UNPUBLISH_PAGE = (PAGE_FIELDS: string) => gql`
    mutation UnpublishPage($id: ID!) {
        websiteBuilder {
            unpublishPage(id: $id) {
               data ${PAGE_FIELDS}
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;

export class UnpublishPageGqlGateway implements IUnpublishPageGateway {
    private client: ApolloClient<any>;
    private modelFields: string;

    constructor(client: ApolloClient<any>, modelFields: string) {
        this.client = client;
        this.modelFields = modelFields;
    }

    async execute(id: string) {
        const { data: response } = await this.client.mutate<
            UnpublishPageResponse,
            UnpublishPageVariables
        >({
            mutation: UNPUBLISH_PAGE(this.modelFields),
            variables: {
                id
            }
        });

        if (!response) {
            throw new Error("Network error while unpublishing page.");
        }

        const { data, error } = response.websiteBuilder.unpublishPage;

        if (!data) {
            throw new Error(error?.message || "Could not unpublish page.");
        }

        return data;
    }
}
