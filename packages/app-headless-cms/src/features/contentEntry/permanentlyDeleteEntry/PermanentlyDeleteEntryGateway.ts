import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse, CmsModel } from "~/types.js";
import {
    PermanentlyDeleteEntryGateway as GatewayAbstraction,
    type IPermanentlyDeleteEntryParams
} from "./abstractions.js";

interface DeleteEntryResponse {
    content: {
        data: boolean | null;
        error: CmsErrorResponse | null;
    };
}

function createMutation(model: CmsModel) {
    return /* GraphQL */ `
        mutation CmsEntriesDelete${model.singularApiName}($revision: ID!, $permanently: Boolean) {
            content: delete${model.singularApiName}(revision: $revision, options: {permanently: $permanently}) {
                data
                error { message code data }
            }
        }
    `;
}

class PermanentlyDeleteEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute({ model, id }: IPermanentlyDeleteEntryParams): Promise<boolean> {
        const response = await this.client.execute<DeleteEntryResponse>({
            query: createMutation(model),
            variables: { revision: id, permanently: true }
        });

        const { data, error } = response.content;

        if (!data) {
            throw new Error(error?.message || "Could not permanently delete the entry.");
        }

        return true;
    }
}

export const PermanentlyDeleteEntryGateway = GatewayAbstraction.createImplementation({
    implementation: PermanentlyDeleteEntryGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
