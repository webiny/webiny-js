import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntryRevision, CmsErrorResponse, CmsModel } from "~/types.js";
import { EntryGraphQLFields } from "../abstractions.js";
import {
    ListRevisionsGateway as GatewayAbstraction,
    type IListRevisionsParams
} from "./abstractions.js";

interface ListRevisionsResponse {
    revisions: {
        data: CmsContentEntryRevision[] | null;
        error: CmsErrorResponse | null;
    };
}

function createQuery(model: CmsModel, fields: EntryGraphQLFields.Interface) {
    return /* GraphQL */ `
        query CmsEntriesGet${model.singularApiName}Revisions($id: ID!) {
            revisions: get${model.singularApiName}Revisions(id: $id) {
                data {
                    ${fields.getSystemFields(model)}
                }
                error { message code data }
            }
        }
    `;
}

class ListRevisionsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: CmsGraphQLClient.Interface,
        private fields: EntryGraphQLFields.Interface
    ) {}

    async execute({ model, entryId }: IListRevisionsParams) {
        const response = await this.client.execute<ListRevisionsResponse>({
            query: createQuery(model, this.fields),
            variables: { id: entryId }
        });

        const { data, error } = response.revisions;

        if (!data) {
            throw new Error(error?.message || "Could not list revisions");
        }

        return data;
    }
}

export const ListRevisionsGateway = GatewayAbstraction.createImplementation({
    implementation: ListRevisionsGatewayImpl,
    dependencies: [CmsGraphQLClient, EntryGraphQLFields]
});
