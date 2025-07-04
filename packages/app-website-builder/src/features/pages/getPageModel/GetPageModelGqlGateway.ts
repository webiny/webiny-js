import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { IGetPageModelGateway } from "./IGetPageModelGateway.js";
import type { PageModelDto } from "~/features/pages/getPageModel/PageModelDto.js";
import type { WbError } from "~/types";

export interface GetPageModelResponse {
    websiteBuilder: {
        getPageModel: {
            data: PageModelDto;
            error: WbError | null;
        };
    };
}

export const GET_PAGE_MODEL = gql`
    query GetPageModel {
        websiteBuilder {
            getPageModel {
                data
                error {
                    code
                    message
                    data
                    stack
                }
            }
        }
    }
`;

export class GetPageModelGqlGateway implements IGetPageModelGateway {
    private client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    async execute() {
        const { data: response } = await this.client.query<GetPageModelResponse>({
            query: GET_PAGE_MODEL,
            fetchPolicy: "network-only"
        });

        if (!response) {
            throw new Error("Network error while fetch page model.");
        }

        const { data, error } = response.websiteBuilder.getPageModel;

        if (!data) {
            throw new Error(error?.message || `Could not fetch page model`);
        }

        return data;
    }
}
