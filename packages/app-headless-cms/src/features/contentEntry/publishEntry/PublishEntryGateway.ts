import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse, CmsModel } from "~/types.js";
import { EntryGraphQLFields } from "../abstractions.js";
import {
    PublishEntryGateway as GatewayAbstraction,
    type IPublishEntryParams
} from "./abstractions.js";

interface PublishEntryResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

function createMutation(model: CmsModel, fields: EntryGraphQLFields.Interface) {
    return /* GraphQL */ `
        mutation CmsPublish${model.singularApiName}($revision: ID!) {
            content: publish${model.singularApiName}(revision: $revision) {
                data {
                    ${fields.getSystemFields(model)}
                    ${fields.getValuesBlock(model)}
                }
                error { message code data }
            }
        }`;
}

class PublishEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: CmsGraphQLClient.Interface,
        private fields: EntryGraphQLFields.Interface
    ) {}

    async execute({ model, revisionId }: IPublishEntryParams) {
        const response = await this.client.execute<PublishEntryResponse>({
            query: createMutation(model, this.fields),
            variables: { revision: revisionId }
        });

        const { data, error } = response.content;

        if (!data) {
            throw new Error(error?.message || "Could not publish entry");
        }

        return data;
    }
}

export const PublishEntryGateway = GatewayAbstraction.createImplementation({
    implementation: PublishEntryGatewayImpl,
    dependencies: [CmsGraphQLClient, EntryGraphQLFields]
});
