import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { IMovePageGateway } from "./IMovePageGateway.js";
import type { WbError } from "~/types.js";

export interface MovePageVariables {
    id: string;
    folderId: string;
}

export interface MovePageResponse {
    websiteBuilder: {
        movePage: {
            data: boolean;
            error: WbError | null;
        };
    };
}

export const MOVE_PAGE = gql`
    mutation MovePage($id: ID!, $folderId: ID!) {
        websiteBuilder {
            movePage(id: $id, folderId: $folderId) {
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

export class MovePageGqlGateway implements IMovePageGateway {
    private client: ApolloClient<any>;
    private modelFields: string;

    constructor(client: ApolloClient<any>, modelFields: string) {
        this.client = client;
        this.modelFields = modelFields;
    }

    async execute(id: string, folderId: string) {
        const { data: response } = await this.client.mutate<MovePageResponse, MovePageVariables>({
            mutation: MOVE_PAGE,
            variables: {
                id,
                folderId
            }
        });

        if (!response) {
            throw new Error("Network error while moving page.");
        }

        const { data, error } = response.websiteBuilder.movePage;

        if (!data) {
            throw new Error(error?.message || "Could not move page.");
        }

        return;
    }
}
