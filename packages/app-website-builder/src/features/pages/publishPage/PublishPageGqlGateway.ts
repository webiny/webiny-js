import type ApolloClient from "apollo-client";
import gql from "graphql-tag";
import type { IPublishPageGateway } from "./IPublishPageGateway.js";
import type { WbError } from "~/types.js";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";

export interface PublishPageVariables {
    id: string;
}

export interface PublishPageResponse {
    websiteBuilder: {
        publishPage: {
            data: PageGatewayDto | null;
            error: WbError | null;
        };
    };
}

export const PUBLISH_PAGE = (fields: string[]) => gql`
    mutation PublishPage($id: ID!) {
        websiteBuilder {
            publishPage(id: $id) {
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

export class PublishPageGqlGateway implements IPublishPageGateway {
    private readonly client;
    private readonly modelFields;

    constructor(client: ApolloClient<any>, modelFields: string[]) {
        this.client = client;
        this.modelFields = modelFields;
    }

    async execute(id: string): Promise<PageGatewayDto> {
        const { data: response } = await this.client.mutate<
            PublishPageResponse,
            PublishPageVariables
        >({
            mutation: PUBLISH_PAGE(this.modelFields),
            variables: {
                id
            }
        });

        if (!response) {
            throw new Error("Network error while publishing page.");
        }

        const { data, error } = response.websiteBuilder.publishPage;

        if (!data) {
            throw new Error(error?.message || "Could not publish page.");
        }

        return data;
    }
}
