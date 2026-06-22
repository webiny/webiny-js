import gql from "graphql-tag";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse } from "~/types.js";
import { createEntrySystemFields, getValuesBlock } from "@webiny/app-headless-cms-common";
import {
    GetEntryGateway as GatewayAbstraction,
    GetEntryGraphQLFieldSelection,
    type IGetEntryParams,
    type IGetEntryGraphQLFieldSelection
} from "./abstractions.js";

interface GetEntryResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

const ERROR_FIELD = /* GraphQL */ `
    {
        message
        code
        data
    }
`;

class GetEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: CmsGraphQLClient.Interface,
        private fieldSelections: IGetEntryGraphQLFieldSelection[]
    ) {}

    async execute({ model, id }: IGetEntryParams) {
        const extraSelection: string[] = [];
        for (const selection of this.fieldSelections) {
            extraSelection.push(...selection.getSelection());
        }

        const query = gql`
            query CmsEntriesGet${model.singularApiName}($revision: ID, $entryId: ID) {
                content: get${model.singularApiName}(revision: $revision, entryId: $entryId) {
                    data {
                        ${createEntrySystemFields(model)}
                        ${extraSelection.join("\n")}
                        ${getValuesBlock(model)}
                    }
                    error ${ERROR_FIELD}
                }
            }
        `;

        const isRevisionId = id.includes("#");

        const response = await this.client.execute<GetEntryResponse>({
            query,
            variables: isRevisionId ? { revision: id } : { entryId: id }
        });

        const { data, error } = response.content;

        if (!data) {
            throw new Error(error?.message || "Could not fetch entry");
        }

        return data;
    }
}

export const GetEntryGateway = GatewayAbstraction.createImplementation({
    implementation: GetEntryGatewayImpl,
    dependencies: [CmsGraphQLClient, [GetEntryGraphQLFieldSelection, { multiple: true }]]
});
