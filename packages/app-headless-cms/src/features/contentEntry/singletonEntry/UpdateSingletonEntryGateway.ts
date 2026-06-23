import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse, CmsModelField } from "~/types.js";
import { createUpdateSingletonMutation } from "@webiny/app-headless-cms-common";
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

class UpdateSingletonEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: CmsGraphQLClient.Interface,
        private preparer: EntryDataPreparer.Interface
    ) {}

    async execute({ model, data, options }: IUpdateSingletonEntryParams) {
        const mutation = createUpdateSingletonMutation(model);
        const preparedData = this.prepareData(data, model.fields);

        const response = await this.client.execute<UpdateSingletonEntryResponse>({
            query: mutation,
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
    dependencies: [CmsGraphQLClient, EntryDataPreparer]
});
