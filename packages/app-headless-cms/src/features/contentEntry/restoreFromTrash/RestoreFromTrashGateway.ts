import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse, CmsModel } from "~/types.js";
import { EntryGraphQLFields } from "../abstractions.js";
import {
    RestoreFromTrashGateway as GatewayAbstraction,
    type IRestoreFromTrashParams
} from "./abstractions.js";

interface RestoreEntryResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

function createMutation(model: CmsModel, fields: EntryGraphQLFields.Interface) {
    return /* GraphQL */ `
        mutation CmsEntriesRestore${model.singularApiName}FromBin($revision: ID!) {
            content: restore${model.singularApiName}FromBin(revision: $revision) {
                data {
                    ${fields.getSystemFields(model)}
                    ${fields.getValuesBlock(model)}
                }
                error { message code data }
            }
        }
    `;
}

class RestoreFromTrashGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: CmsGraphQLClient.Interface,
        private fields: EntryGraphQLFields.Interface
    ) {}

    async execute({ model, id }: IRestoreFromTrashParams): Promise<CmsContentEntry> {
        const response = await this.client.execute<RestoreEntryResponse>({
            query: createMutation(model, this.fields),
            variables: { revision: id }
        });

        const { data, error } = response.content;

        if (!data) {
            throw new Error(error?.message || "Could not restore the entry from trash bin.");
        }

        return data;
    }
}

export const RestoreFromTrashGateway = GatewayAbstraction.createImplementation({
    implementation: RestoreFromTrashGatewayImpl,
    dependencies: [CmsGraphQLClient, EntryGraphQLFields]
});
