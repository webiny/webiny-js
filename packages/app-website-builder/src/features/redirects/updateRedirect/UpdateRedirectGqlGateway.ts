import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { IUpdateRedirectGateway } from "./IUpdateRedirectGateway.js";
import { RedirectDto } from "./RedirectDto.js";
import { type WbError } from "~/types";
import type { RedirectGqlDto } from "~/features/redirects/createRedirect/RedirectGqlDto.js";

export interface UpdateRedirectResponse {
    websiteBuilder: {
        updateRedirect: {
            data: RedirectGqlDto;
            error: WbError | null;
        };
    };
}

export interface UpdateRedirectVariables {
    id: string;
    data: Partial<
        Omit<
            RedirectDto,
            | "id"
            | "wbyAco_location"
            | "createdOn"
            | "createdBy"
            | "savedOn"
            | "savedBy"
            | "modifiedOn"
            | "modifiedBy"
            | "redirectFrom"
            | "redirectTo"
            | "redirectType"
            | "isEnabled"
        >
    >;
}

export const UPDATE_MUTATION = (FIELDS: string) => gql`
    mutation UpdateRedirect($id: ID!, $data: WbRedirectUpdateInput!) {
        websiteBuilder {
            updateRedirect(id: $id, data: $data) {
                data ${FIELDS}
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;

export class UpdateRedirectGqlGateway implements IUpdateRedirectGateway {
    private client: ApolloClient<any>;
    private selection: string;

    constructor(client: ApolloClient<any>, selection: string) {
        this.client = client;
        this.selection = selection;
    }

    async execute(redirect: RedirectDto) {
        const { id, redirectTo, redirectType, redirectFrom, isEnabled } = redirect;

        const { data: response } = await this.client.mutate<
            UpdateRedirectResponse,
            UpdateRedirectVariables
        >({
            mutation: UPDATE_MUTATION(this.selection),
            variables: {
                id,
                data: {
                    redirectTo,
                    redirectType,
                    redirectFrom,
                    isEnabled
                }
            }
        });

        if (!response) {
            throw new Error("Network error while updating redirect.");
        }

        const { data, error } = response.websiteBuilder.updateRedirect;

        if (!data) {
            throw new Error(error?.message || "Could not update redirect.");
        }

        return data;
    }
}
