import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse, CmsModel, CmsModelField } from "~/types.js";
import { EntryGraphQLFields } from "../abstractions.js";
import {
    UpdateEntryGateway as GatewayAbstraction,
    type IUpdateEntryParams
} from "./abstractions.js";
import { EntryDataPreparer } from "~/features/contentEntry/valueTransformers/EntryDataPreparer.js";

interface UpdateEntryResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

function createMutation(model: CmsModel, fields: EntryGraphQLFields.Interface) {
    return /* GraphQL */ `
        mutation CmsUpdate${model.singularApiName}($revision: ID!, $data: ${model.singularApiName}Input!, $options: UpdateCmsEntryOptionsInput) {
            content: update${model.singularApiName}(revision: $revision, data: $data, options: $options) {
                data {
                    ${fields.getSystemFields(model)}
                    ${fields.getValuesBlock(model)}
                }
                error { message code data }
            }
        }
    `;
}

class UpdateEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: CmsGraphQLClient.Interface,
        private preparer: EntryDataPreparer.Interface,
        private fields: EntryGraphQLFields.Interface
    ) {}

    async execute({ model, revisionId, data, options }: IUpdateEntryParams) {
        const preparedData = this.prepareData(data, model.fields);

        const response = await this.client.execute<UpdateEntryResponse>({
            query: createMutation(model, this.fields),
            variables: { revision: revisionId, data: preparedData, options }
        });

        const { data: entry, error } = response.content;

        if (!entry) {
            throw new Error(error?.message || "Could not update entry");
        }

        return entry;
    }

    private prepareData(
        data: Record<string, unknown>,
        fields: CmsModelField[]
    ): Record<string, unknown> {
        const values = data.values;
        if (!values || typeof values !== "object") {
            return data;
        }
        return {
            ...data,
            values: this.preparer.prepare(values as Record<string, unknown>, fields)
        };
    }
}

export const UpdateEntryGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateEntryGatewayImpl,
    dependencies: [CmsGraphQLClient, EntryDataPreparer, EntryGraphQLFields]
});
