import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse, CmsModel } from "~/types.js";
import { EntryGraphQLFields } from "../abstractions.js";
import {
    GetSingletonEntryGateway as GatewayAbstraction,
    type IGetSingletonEntryParams
} from "./abstractions.js";

interface GetSingletonEntryResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

function createQuery(model: CmsModel, fields: EntryGraphQLFields.Interface) {
    return /* GraphQL */ `
        query CmsEntryGetSingleton${model.singularApiName} {
            content: get${model.singularApiName} {
                data {
                    ${fields.getSystemFields(model)}
                    ${fields.getValuesBlock(model)}
                }
                error { message code data }
            }
        }
    `;
}

class GetSingletonEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: CmsGraphQLClient.Interface,
        private fields: EntryGraphQLFields.Interface
    ) {}

    async execute({ model }: IGetSingletonEntryParams) {
        const response = await this.client.execute<GetSingletonEntryResponse>({
            query: createQuery(model, this.fields)
        });

        const { data, error } = response.content;

        if (!data) {
            throw new Error(error?.message || "Could not fetch singleton entry");
        }

        return data;
    }
}

export const GetSingletonEntryGateway = GatewayAbstraction.createImplementation({
    implementation: GetSingletonEntryGatewayImpl,
    dependencies: [CmsGraphQLClient, EntryGraphQLFields]
});
