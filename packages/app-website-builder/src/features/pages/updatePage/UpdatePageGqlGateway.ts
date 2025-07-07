import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { IUpdatePageGateway } from "./IUpdatePageGateway.js";
import { PageDto } from "./PageDto.js";
import { type WbError } from "~/types";
import type { PageGqlDto } from "~/features/pages/createPage/PageGqlDto.js";

export interface UpdatePageResponse {
    websiteBuilder: {
        updatePage: {
            data: PageGqlDto;
            error: WbError | null;
        };
    };
}

export interface UpdatePageVariables {
    id: string;
    data: Partial<
        Omit<
            PageDto,
            | "id"
            | "entryId"
            | "wbyAco_location"
            | "status"
            | "createdOn"
            | "createdBy"
            | "savedOn"
            | "savedBy"
            | "modifiedOn"
            | "modifiedBy"
        >
    >;
}

export const UPDATE_PAGE = (PAGE_FIELDS: string) => gql`
    mutation UpdatePage($id: ID!, $data: WbPageUpdateInput!) {
        websiteBuilder {
            updatePage(id: $id, data: $data) {
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

export class UpdatePageGqlGateway implements IUpdatePageGateway {
    private client: ApolloClient<any>;
    private modelFields: string;

    constructor(client: ApolloClient<any>, modelFields: string) {
        this.client = client;
        this.modelFields = modelFields;
    }

    async execute(page: PageDto) {
        const { id, properties, metadata, elements, bindings, extensions } = page;

        const { data: response } = await this.client.mutate<
            UpdatePageResponse,
            UpdatePageVariables
        >({
            mutation: UPDATE_PAGE(this.modelFields),
            variables: {
                id,
                data: {
                    properties,
                    metadata,
                    elements,
                    bindings,
                    extensions
                }
            }
        });

        if (!response) {
            throw new Error("Network error while updating page.");
        }

        const { data, error } = response.websiteBuilder.updatePage;

        if (!data) {
            throw new Error(error?.message || "Could not update page.");
        }

        return data;
    }
}
