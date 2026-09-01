import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse } from "~/types.js";
import type { CmsReferenceEntry } from "../refTypes.js";
import { REFERENCE_ENTRY_FIELDS } from "../refTypes.js";
import {
    GetContentEntriesGateway as GatewayAbstraction,
    type IGetContentEntriesGatewayParams,
    type IGetContentEntriesGatewayResult
} from "./abstractions.js";

interface GetContentEntriesResponse {
    latest: {
        data: CmsReferenceEntry[] | null;
        error: CmsErrorResponse | null;
    };
    published: {
        data: CmsReferenceEntry[] | null;
        error: CmsErrorResponse | null;
    };
}

const GET_CONTENT_ENTRIES = /* GraphQL */ `
    query CmsGetContentEntries($entries: [CmsModelEntryInput!]!) {
        latest: getLatestContentEntries(entries: $entries) {
            ${REFERENCE_ENTRY_FIELDS}
        }
        published: getPublishedContentEntries(entries: $entries) {
            ${REFERENCE_ENTRY_FIELDS}
        }
    }
`;

class GetContentEntriesGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute(
        params: IGetContentEntriesGatewayParams
    ): Promise<IGetContentEntriesGatewayResult> {
        const response = await this.client.execute<GetContentEntriesResponse>({
            query: GET_CONTENT_ENTRIES,
            variables: {
                entries: params.entries.map(e => ({ id: e.id, modelId: e.modelId }))
            }
        });

        const latestError = response.latest.error;
        const publishedError = response.published.error;

        if (latestError) {
            throw new Error(latestError.message || "Could not fetch latest content entries");
        }
        if (publishedError) {
            throw new Error(publishedError.message || "Could not fetch published content entries");
        }

        return {
            latest: response.latest.data || [],
            published: response.published.data || []
        };
    }
}

export const GetContentEntriesGateway = GatewayAbstraction.createImplementation({
    implementation: GetContentEntriesGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
