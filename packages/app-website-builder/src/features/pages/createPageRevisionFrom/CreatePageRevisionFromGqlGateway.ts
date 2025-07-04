import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { ICreatePageRevisionFromGateway } from "./ICreatePageRevisionFromGateway.js";
import type { WbError } from "~/types.js";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";

export interface CreatePageRevisionFromVariables {
    id: string;
}

export interface CreatePageRevisionFromPageResponse {
    websiteBuilder: {
        createPageRevisionFrom: {
            data: PageGatewayDto | null;
            error: WbError | null;
        };
    };
}

export const CREATE_PAGE_REVISION_FROM = (PAGE_FIELDS: string) => gql`
    mutation CreatePageRevisionFrom($id: ID!) {
        websiteBuilder {
            createPageRevisionFrom(id: $id) {
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

export class CreatePageRevisionFromGqlGateway implements ICreatePageRevisionFromGateway {
    private client: ApolloClient<any>;
    private modelFields: string;

    constructor(client: ApolloClient<any>, modelFields: string) {
        this.client = client;
        this.modelFields = modelFields;
    }

    async execute(id: string) {
        const { data: response } = await this.client.mutate<
            CreatePageRevisionFromPageResponse,
            CreatePageRevisionFromVariables
        >({
            mutation: CREATE_PAGE_REVISION_FROM(this.modelFields),
            variables: {
                id
            }
        });

        if (!response) {
            throw new Error("Network error while creating page revision.");
        }

        const { data, error } = response.websiteBuilder.createPageRevisionFrom;

        if (!data) {
            throw new Error(error?.message || "Could not create page revision.");
        }

        return data;
    }
}
