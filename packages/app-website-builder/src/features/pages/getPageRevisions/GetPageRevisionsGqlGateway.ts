import type { ApolloClient } from "@apollo/client";
import gql from "graphql-tag";
import type { WbError } from "~/types.js";
import type { IGetPageRevisionsGateway } from "~/features/pages/getPageRevisions/IGetPageRevisionsGateway.js";
import type { PageRevisionGatewayDto } from "~/features/pages/getPageRevisions/PageRevisionGatewayDto.js";

export interface GetPageRevisionsResponse {
    websiteBuilder: {
        getPageRevisions:
            | {
                  data: PageRevisionGatewayDto[];
                  error: null;
              }
            | {
                  data: null;
                  error: WbError;
              };
    };
}

export interface GetPageRevisionsQueryVariables {
    entryId: string;
}

export const GET_PAGE_REVISIONS = gql`
    query GetPageRevisions($entryId: ID!) {
        websiteBuilder {
            getPageRevisions(entryId: $entryId) {
                data {
                    id
                    entryId
                    title
                    version
                    status
                    locked
                    savedOn
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

export class GetPageRevisionsGqlGateway implements IGetPageRevisionsGateway {
    private client: ApolloClient;

    constructor(client: ApolloClient) {
        this.client = client;
    }

    async execute(entryId: string) {
        if (!entryId) {
            throw new Error("Page `id` is mandatory");
        }

        const { data: response } = await this.client.query<
            GetPageRevisionsResponse,
            GetPageRevisionsQueryVariables
        >({
            query: GET_PAGE_REVISIONS,
            variables: { entryId },
            fetchPolicy: "network-only"
        });

        if (!response) {
            throw new Error("Network error while fetch page.");
        }

        const { data, error } = response.websiteBuilder.getPageRevisions;

        if (!data) {
            throw new Error(error?.message || `Could not fetch revisions for page: ${entryId}.`);
        }

        return data;
    }
}
