import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse, CmsModel } from "~/types.js";
import { EntryGraphQLFields } from "../abstractions.js";
import {
    UnpublishEntryGateway as GatewayAbstraction,
    type IUnpublishEntryParams
} from "./abstractions.js";

interface UnpublishEntryResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

function createMutation(model: CmsModel, fields: EntryGraphQLFields.Interface) {
    return /* GraphQL */ `
        mutation CmsUnpublish${model.singularApiName}($revision: ID!) {
            content: unpublish${model.singularApiName}(revision: $revision) {
                data {
                    ${fields.getSystemFields(model)}
                    ${fields.getValuesBlock(model)}
                }
                error { message code data }
            }
        }`;
}

class UnpublishEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: CmsGraphQLClient.Interface,
        private fields: EntryGraphQLFields.Interface
    ) {}

    async execute({ model, revisionId }: IUnpublishEntryParams) {
        const response = await this.client.execute<UnpublishEntryResponse>({
            query: createMutation(model, this.fields),
            variables: { revision: revisionId }
        });

        const { data, error } = response.content;

        if (!data) {
            throw new Error(error?.message || "Could not unpublish entry");
        }

        return data;
    }
}

export const UnpublishEntryGateway = GatewayAbstraction.createImplementation({
    implementation: UnpublishEntryGatewayImpl,
    dependencies: [CmsGraphQLClient, EntryGraphQLFields]
});
