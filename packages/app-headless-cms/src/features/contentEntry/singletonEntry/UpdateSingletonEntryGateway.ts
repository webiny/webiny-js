import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse, CmsModel, CmsModelField } from "~/types.js";
import { EntryGraphQLFields } from "../abstractions.js";
import {
    UpdateSingletonEntryGateway as GatewayAbstraction,
    type IUpdateSingletonEntryParams
} from "./abstractions.js";
import { EntryDataPreparer } from "~/features/contentEntry/valueTransformers/EntryDataPreparer.js";

interface UpdateSingletonEntryResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

function createMutation(model: CmsModel, fields: EntryGraphQLFields.Interface) {
    return /* GraphQL */ `
        mutation CmsUpdate${model.singularApiName}($data: ${model.singularApiName}Input!, $options: UpdateCmsEntryOptionsInput) {
            content: update${model.singularApiName}(data: $data, options: $options) {
                data {
                    ${fields.getSystemFields(model)}
                    ${fields.getValuesBlock(model)}
                }
                error { message code data }
            }
        }
    `;
}

class UpdateSingletonEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: CmsGraphQLClient.Interface,
        private preparer: EntryDataPreparer.Interface,
        private fields: EntryGraphQLFields.Interface
    ) {}

    async execute({ model, data, options }: IUpdateSingletonEntryParams) {
        const preparedData = this.prepareData(data, model.fields);

        const response = await this.client.execute<UpdateSingletonEntryResponse>({
            query: createMutation(model, this.fields),
            variables: { data: preparedData, options }
        });

        const { data: entry, error } = response.content;

        if (!entry) {
            throw new Error(error?.message || "Could not update singleton entry");
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

export const UpdateSingletonEntryGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateSingletonEntryGatewayImpl,
    dependencies: [CmsGraphQLClient, EntryDataPreparer, EntryGraphQLFields]
});
