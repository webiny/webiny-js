import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse, CmsModelField } from "~/types.js";
import { createUpdateMutation } from "@webiny/app-headless-cms-common";
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

class UpdateEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: CmsGraphQLClient.Interface,
        private preparer: EntryDataPreparer.Interface
    ) {}

    async execute({ model, revisionId, data, options }: IUpdateEntryParams) {
        const mutation = createUpdateMutation(model);
        const preparedData = this.prepareData(data, model.fields);

        const response = await this.client.execute<UpdateEntryResponse>({
            query: mutation,
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
    dependencies: [CmsGraphQLClient, EntryDataPreparer]
});
