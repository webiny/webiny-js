import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { IMoveRedirectGateway } from "./IMoveRedirectGateway.js";
import type { WbError } from "~/types.js";

export interface MoveRedirectVariables {
    id: string;
    folderId: string;
}

export interface MoveRedirectResponse {
    websiteBuilder: {
        moveRedirect: {
            data: boolean;
            error: WbError | null;
        };
    };
}

export const MOVE_MUTATION = gql`
    mutation MoveRedirect($id: ID!, $folderId: ID!) {
        websiteBuilder {
            moveRedirect(id: $id, folderId: $folderId) {
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

export class MoveRedirectGqlGateway implements IMoveRedirectGateway {
    private client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    async execute(id: string, folderId: string) {
        const { data: response } = await this.client.mutate<MoveRedirectResponse, MoveRedirectVariables>({
            mutation: MOVE_MUTATION,
            variables: {
                id,
                folderId
            }
        });

        if (!response) {
            throw new Error("Network error while moving redirect.");
        }

        const { data, error } = response.websiteBuilder.moveRedirect;

        if (!data) {
            throw new Error(error?.message || "Could not move redirect.");
        }

        return;
    }
}
