import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse, CmsModel } from "~/types.js";
import { EntryGraphQLFields } from "../abstractions.js";
import {
    DuplicateEntryGateway as GatewayAbstraction,
    type IDuplicateEntryParams
} from "./abstractions.js";

interface DuplicateEntryResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

function createMutation(model: CmsModel, fields: EntryGraphQLFields.Interface) {
    return /* GraphQL */ `
        mutation CmsEntriesDuplicate${model.singularApiName}($revision: ID!) {
            content: duplicate${model.singularApiName}(revision: $revision) {
                data {
                    ${fields.getSystemFields(model)}
                    ${fields.getValuesBlock(model)}
                }
                error { message code data }
            }
        }
    `;
}

class DuplicateEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: CmsGraphQLClient.Interface,
        private fields: EntryGraphQLFields.Interface
    ) {}

    async execute({ model, revisionId }: IDuplicateEntryParams) {
        const response = await this.client.execute<DuplicateEntryResponse>({
            query: createMutation(model, this.fields),
            variables: { revision: revisionId }
        });

        const { data: entry, error } = response.content;

        if (!entry) {
            throw new Error(error?.message || "Could not duplicate entry");
        }

        return entry;
    }
}

export const DuplicateEntryGateway = GatewayAbstraction.createImplementation({
    implementation: DuplicateEntryGatewayImpl,
    dependencies: [CmsGraphQLClient, EntryGraphQLFields]
});
