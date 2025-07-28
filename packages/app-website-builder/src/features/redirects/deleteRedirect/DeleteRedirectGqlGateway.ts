import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { IDeleteRedirectGateway } from "./IDeleteRedirectGateway.js";
import type { WbError } from "~/types.js";

export interface DeleteRedirectVariables {
    id: string;
}

export interface DeleteRedirectResponse {
    websiteBuilder: {
        deleteRedirect: {
            data: boolean;
            error: WbError | null;
        };
    };
}

export const DELETE_MUTATION = gql`
    mutation DeleteRedirect($id: ID!) {
        websiteBuilder {
            deleteRedirect(id: $id) {
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

export class DeleteRedirectGqlGateway implements IDeleteRedirectGateway {
    private client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    async execute(id: string) {
        const { data: response } = await this.client.mutate<
            DeleteRedirectResponse,
            DeleteRedirectVariables
        >({
            mutation: DELETE_MUTATION,
            variables: {
                id
            }
        });

        if (!response) {
            throw new Error("Network error while deleting redirect.");
        }

        const { data, error } = response.websiteBuilder.deleteRedirect;

        if (!data) {
            throw new Error(error?.message || "Could not delete redirect.");
        }

        return;
    }
}
