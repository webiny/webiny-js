import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse, CmsModelField } from "~/types.js";
import { createCreateMutation } from "@webiny/app-headless-cms-common";
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

class CreateEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: CmsGraphQLClient.Interface,
        private preparer: EntryDataPreparer.Interface
    ) {}

    async execute({ model, data, options }: ICreateEntryGatewayParams) {
        const mutation = createCreateMutation(model);
        const preparedData = this.prepareData(data, model.fields);

        const response = await this.client.execute<CreateEntryResponse>({
            query: mutation,
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
    dependencies: [CmsGraphQLClient, EntryDataPreparer]
});
