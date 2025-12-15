import type ApolloClient from "apollo-client";
import gql from "graphql-tag";
import type { IGetPageGateway } from "~/features/pages/getPage/IGetPageGateway.js";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";
import type { WbError } from "~/types.js";

export interface GetPageResponse {
    websiteBuilder: {
        getPageById: {
            data: PageGatewayDto | null;
            error: WbError | null;
        };
    };
}

export interface GetPageQueryVariables {
    id: string;
}

export const GET_PAGE = (fields: string[]) => gql`
    query GetPage($id: ID!) {
        websiteBuilder {
            getPageById(id: $id) {
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

export class GetPageGqlGateway implements IGetPageGateway {
    private readonly client;
    private readonly modelFields;

    public constructor(client: ApolloClient<object>, modelFields: string[]) {
        this.client = client;
        this.modelFields = modelFields;
    }

    public async execute(id: string) {
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

        const { data, error } = response.websiteBuilder.getPageById;

        if (!data) {
            throw new Error(error?.message || `Could not fetch page with id: ${id}.`);
        }

        return data;
    }
}
