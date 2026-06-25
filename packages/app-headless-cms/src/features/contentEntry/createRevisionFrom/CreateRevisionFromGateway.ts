import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse, CmsModel } from "~/types.js";
import { EntryGraphQLFields } from "../abstractions.js";
import {
    CreateRevisionFromGateway as GatewayAbstraction,
    type ICreateRevisionFromParams
} from "./abstractions.js";

interface CreateRevisionFromResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

function createMutation(model: CmsModel, fields: EntryGraphQLFields.Interface) {
    return /* GraphQL */ `
        mutation CmsCreate${model.singularApiName}From($revision: ID!, $data: ${model.singularApiName}Input, $options: CreateRevisionCmsEntryOptionsInput) {
            content: create${model.singularApiName}From(revision: $revision, data: $data, options: $options) {
                data {
                    ${fields.getSystemFields(model)}
                    ${fields.getValuesBlock(model)}
                }
                error { message code data }
            }
        }`;
}

class CreateRevisionFromGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: CmsGraphQLClient.Interface,
        private fields: EntryGraphQLFields.Interface
    ) {}

    async execute({ model, revisionId, data, options }: ICreateRevisionFromParams) {
        const response = await this.client.execute<CreateRevisionFromResponse>({
            query: createMutation(model, this.fields),
            variables: { revision: revisionId, data, options }
        });

        const { data: entry, error } = response.content;

        if (!entry) {
            throw new Error(error?.message || "Could not create revision");
        }

        return entry;
    }
}

export const CreateRevisionFromGateway = GatewayAbstraction.createImplementation({
    implementation: CreateRevisionFromGatewayImpl,
    dependencies: [CmsGraphQLClient, EntryGraphQLFields]
});
