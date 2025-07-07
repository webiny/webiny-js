import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { IDeletePageGateway } from "./IDeletePageGateway.js";
import type { WbError } from "~/types.js";

export interface DeletePageVariables {
    id: string;
}

export interface DeletePageResponse {
    websiteBuilder: {
        deletePage: {
            data: boolean;
            error: WbError | null;
        };
    };
}

export const DELETE_PAGE = gql`
    mutation DeletePage($id: ID!) {
        websiteBuilder {
            deletePage(id: $id) {
                data
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;

export class DeletePageGqlGateway implements IDeletePageGateway {
    private client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    async execute(id: string) {
        const { data: response } = await this.client.mutate<
            DeletePageResponse,
            DeletePageVariables
        >({
            mutation: DELETE_PAGE,
            variables: {
                id
            }
        });

        if (!response) {
            throw new Error("Network error while deleting page.");
        }

        const { data, error } = response.websiteBuilder.deletePage;

        if (!data) {
            throw new Error(error?.message || "Could not delete page.");
        }

        return;
    }
}
