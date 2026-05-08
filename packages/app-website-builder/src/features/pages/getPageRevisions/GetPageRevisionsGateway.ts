import { GetPageRevisionsGateway as GatewayAbstraction } from "./abstractions.js";
import type { PageRevisionGatewayDto } from "./PageRevisionGatewayDto.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

const GET_PAGE_REVISIONS = /* GraphQL */ `
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
                    revisionDescription
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

type GetPageRevisionsResponse = {
    websiteBuilder: {
        getPageRevisions:
            | { data: PageRevisionGatewayDto[]; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class GetPageRevisionsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(entryId: string): Promise<PageRevisionGatewayDto[]> {
        if (!entryId) {
            throw new Error("Page `id` is mandatory");
        }

        const response = await this.client.execute<GetPageRevisionsResponse>({
            query: GET_PAGE_REVISIONS,
            variables: { entryId }
        });

        const envelope = response.websiteBuilder.getPageRevisions;
        if (envelope.error) {
            throw new Error(
                envelope.error.message || `Could not fetch revisions for page: ${entryId}.`
            );
        }

        return envelope.data;
    }
}

export const GetPageRevisionsGateway = GatewayAbstraction.createImplementation({
    implementation: GetPageRevisionsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
