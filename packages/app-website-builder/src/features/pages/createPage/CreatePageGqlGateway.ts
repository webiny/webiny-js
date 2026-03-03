import type { ApolloClient } from "@apollo/client";
import gql from "graphql-tag";
import type { ICreatePageGateway } from "./ICreatePageGateway.js";
import type { PageDto } from "./PageDto.js";
import type { WbError } from "~/types.js";
import type { PageGqlDto } from "~/features/pages/createPage/PageGqlDto.js";

export interface CreatePageResponse {
    websiteBuilder: {
        createPage: {
            data: PageGqlDto;
            error: WbError | null;
        };
    };
}

export interface CreatePageVariables {
    data: PageDto;
}

export const CREATE_PAGE = (fields: string[]) => gql`
        mutation CreatePage($data: WbPageCreateInput!) {
            websiteBuilder {
                createPage(data: $data) {
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

export class CreatePageGqlGateway implements ICreatePageGateway {
    private client;
    private readonly modelFields;

    constructor(client: ApolloClient, modelFields: string[]) {
        this.client = client;
        this.modelFields = modelFields;
    }

    async execute(page: PageDto) {
        const { data: response } = await this.client.mutate<
            CreatePageResponse,
            CreatePageVariables
        >({
            mutation: CREATE_PAGE(this.modelFields),
            variables: {
                data: {
                    ...page
                }
            }
        });

        if (!response) {
            throw new Error("Network error while creating page.");
        }

        const { data, error } = response.websiteBuilder.createPage;

        if (!data) {
            throw new Error(error?.message || "Could not create page.");
        }

        return data;
    }
}
