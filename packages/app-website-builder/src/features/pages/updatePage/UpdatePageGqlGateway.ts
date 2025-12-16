import type ApolloClient from "apollo-client";
import gql from "graphql-tag";
import type { IUpdatePageGateway } from "./IUpdatePageGateway.js";
import type { PageDto } from "./PageDto.js";
import { type WbError } from "~/types.js";
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

export const UPDATE_PAGE = (fields: string[]) => gql`
    mutation UpdatePage($id: ID!, $data: WbPageUpdateInput!) {
        websiteBuilder {
            updatePage(id: $id, data: $data) {
                data {
                    ${fields.join("\n")}
                }
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
    private readonly client;
    private readonly modelFields;

    constructor(client: ApolloClient<any>, modelFields: string[]) {
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
