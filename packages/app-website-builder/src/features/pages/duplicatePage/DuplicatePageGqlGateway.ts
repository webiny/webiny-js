import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { IDuplicatePageGateway } from "./IDuplicatePageGateway.js";
import type { WbError } from "~/types.js";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";

export interface DuplicatePageVariables {
    id: string;
}

export interface DuplicatePageResponse {
    websiteBuilder: {
        duplicatePage: {
            data: PageGatewayDto | null;
            error: WbError | null;
        };
    };
}

export const DUPLICATE_PAGE = (PAGE_FIELDS: string) => gql`
    mutation DuplicatePage($id: ID!) {
        websiteBuilder {
            duplicatePage(id: $id) {
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

export class DuplicatePageGqlGateway implements IDuplicatePageGateway {
    private client: ApolloClient<any>;
    private modelFields: string;

    constructor(client: ApolloClient<any>, modelFields: string) {
        this.client = client;
        this.modelFields = modelFields;
    }

    async execute(id: string) {
        const { data: response } = await this.client.mutate<
            DuplicatePageResponse,
            DuplicatePageVariables
        >({
            mutation: DUPLICATE_PAGE(this.modelFields),
            variables: {
                id
            }
        });

        if (!response) {
            throw new Error("Network error while duplicating page.");
        }

        const { data, error } = response.websiteBuilder.duplicatePage;

        if (!data) {
            throw new Error(error?.message || "Could not duplicate page.");
        }

        return data;
    }
}
