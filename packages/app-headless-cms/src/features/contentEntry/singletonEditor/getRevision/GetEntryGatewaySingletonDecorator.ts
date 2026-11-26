import { isSingletonModel } from "@webiny/app-headless-cms-common";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse } from "~/types.js";
import { EntryGraphQLFields } from "../../abstractions.js";
import {
    GetEntryGateway,
    GetEntryGraphQLFieldSelection,
    type IGetEntryGraphQLFieldSelection,
    type IGetEntryParams
} from "../../getEntry/abstractions.js";

interface GetSingletonRevisionResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

class GetEntryGatewaySingleton implements GetEntryGateway.Interface {
    constructor(
        private client: CmsGraphQLClient.Interface,
        private fields: EntryGraphQLFields.Interface,
        private fieldSelections: IGetEntryGraphQLFieldSelection[],
        private decoratee: GetEntryGateway.Interface
    ) {}

    async execute(params: IGetEntryParams) {
        const { model, id } = params;

        if (!isSingletonModel(model)) {
            return this.decoratee.execute(params);
        }

        const extraSelection: string[] = [];
        for (const selection of this.fieldSelections) {
            extraSelection.push(...selection.getSelection());
        }

        const query = /* GraphQL */ `
            query CmsEntryGetSingletonRevision${model.singularApiName}($revision: ID!) {
                content: get${model.singularApiName}Revision(revision: $revision) {
                    data {
                        ${this.fields.getSystemFields(model)}
                        ${extraSelection.join("\n")}
                        ${this.fields.getValuesBlock(model)}
                    }
                    error { message code data }
                }
            }
        `;

        const response = await this.client.execute<GetSingletonRevisionResponse>({
            query,
            variables: { revision: id }
        });

        const { data, error } = response.content;

        if (!data) {
            throw new Error(error?.message || "Could not fetch entry");
        }

        return data;
    }
}

export const GetEntryGatewaySingletonDecorator = GetEntryGateway.createDecorator({
    decorator: GetEntryGatewaySingleton,
    dependencies: [
        CmsGraphQLClient,
        EntryGraphQLFields,
        [GetEntryGraphQLFieldSelection, { multiple: true }]
    ]
});
