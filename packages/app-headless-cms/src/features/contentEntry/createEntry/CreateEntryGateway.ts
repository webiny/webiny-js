import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse, CmsModel, CmsModelField } from "~/types.js";
import { EntryGraphQLFields } from "../abstractions.js";
import {
    CreateEntryGateway as GatewayAbstraction,
    type ICreateEntryGatewayParams
} from "./abstractions.js";
import { EntryDataPreparer } from "~/features/contentEntry/valueTransformers/EntryDataPreparer.js";

interface CreateEntryResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

function createMutation(model: CmsModel, fields: EntryGraphQLFields.Interface) {
    return /* GraphQL */ `
        mutation CmsEntriesCreate${model.singularApiName}($data: ${model.singularApiName}Input!, $options: CreateCmsEntryOptionsInput) {
            content: create${model.singularApiName}(data: $data, options: $options) {
                data {
                    ${fields.getSystemFields(model)}
                    ${fields.getValuesBlock(model)}
                }
                error { message code data }
            }
        }
    `;
}

class CreateEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: CmsGraphQLClient.Interface,
        private preparer: EntryDataPreparer.Interface,
        private fields: EntryGraphQLFields.Interface
    ) {}

    async execute({ model, data, options }: ICreateEntryGatewayParams) {
        const preparedData = this.prepareData(data, model.fields);

        const response = await this.client.execute<CreateEntryResponse>({
            query: createMutation(model, this.fields),
            variables: { data: preparedData, options }
        });

        const { data: entry, error } = response.content;

        if (!entry) {
            throw new Error(error?.message || "Could not create entry");
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

export const CreateEntryGateway = GatewayAbstraction.createImplementation({
    implementation: CreateEntryGatewayImpl,
    dependencies: [CmsGraphQLClient, EntryDataPreparer, EntryGraphQLFields]
});
