import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import type { IGetPageGateway } from "~/features/pages/getPage/IGetPageGateway.js";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";
import type { WbError } from "~/types.js";

export interface GetPageResponse {
    websiteBuilder: {
        getPage: {
            data: PageGatewayDto | null;
            error: WbError | null;
        };
    };
}

export interface GetPageQueryVariables {
    id: string;
}

export const GET_PAGE = (PAGE_FIELDS: string) => gql`
    query GetPage($id: ID!) {
        websiteBuilder {
            getPage(id: $id) {
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

export class GetPageGqlGateway implements IGetPageGateway {
    private client: ApolloClient<any>;
    private modelFields: string;

    constructor(client: ApolloClient<any>, modelFields: string) {
        this.client = client;
        this.modelFields = modelFields;
    }

    async execute(id: string) {
        if (!id) {
            throw new Error("Page `id` is mandatory");
        }

        const { data: response } = await this.client.query<GetPageResponse, GetPageQueryVariables>({
            query: GET_PAGE(this.modelFields),
            variables: { id },
            fetchPolicy: "network-only"
        });

        if (!response) {
            throw new Error("Network error while fetch page.");
        }

        const { data, error } = response.websiteBuilder.getPage;

        if (!data) {
            throw new Error(error?.message || `Could not fetch page with id: ${id}.`);
        }

        return data;
    }
}
