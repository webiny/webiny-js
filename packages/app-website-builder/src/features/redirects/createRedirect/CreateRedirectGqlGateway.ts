import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { ICreateRedirectGateway } from "./ICreateRedirectGateway.js";
import { RedirectDto } from "./RedirectDto.js";
import type { WbError } from "~/types.js";
import type { RedirectGqlDto } from "~/features/redirects/createRedirect/RedirectGqlDto.js";

export interface CreateRedirectResponse {
    websiteBuilder: {
        createRedirect: {
            data: RedirectGqlDto;
            error: WbError | null;
        };
    };
}

export interface CreateRedirectVariables {
    data: RedirectDto;
}

export const CREATE_PAGE = (FIELDS: string) => gql`
        mutation CreateRedirect($data: WbRedirectCreateInput!) {
            websiteBuilder {
                createRedirect(data: $data) {
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

export class CreateRedirectGqlGateway implements ICreateRedirectGateway {
    private client: ApolloClient<any>;
    private selection: string;

    constructor(client: ApolloClient<any>, selection: string) {
        this.client = client;
        this.selection = selection;
    }

    async execute(page: RedirectDto) {
        const { data: response } = await this.client.mutate<
            CreateRedirectResponse,
            CreateRedirectVariables
        >({
            mutation: CREATE_PAGE(this.selection),
            variables: {
                data: {
                    ...page
                }
            }
        });

        if (!response) {
            throw new Error("Network error while creating page.");
        }

        const { data, error } = response.websiteBuilder.createRedirect;

        if (!data) {
            throw new Error(error?.message || "Could not create redirect.");
        }

        return data;
    }
}
