import { Result } from "@webiny/feature/api";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse, CmsModel } from "~/types.js";
import { CmsEntryError } from "~/features/contentEntry/CmsEntryError.js";
import { EntryGraphQLFields } from "../../abstractions.js";
import { GetLatestSingletonEntryGateway as GatewayAbstraction } from "./gatewayAbstractions.js";

interface GetLatestSingletonEntryResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

function createQuery(model: CmsModel, fields: EntryGraphQLFields.Interface) {
    return /* GraphQL */ `
        query CmsEntryGetLatestSingleton${model.singularApiName} {
            content: get${model.singularApiName}Latest {
                data {
                    ${fields.getSystemFields(model)}
                    ${fields.getValuesBlock(model)}
                }
                error { message code data }
            }
        }
    `;
}

class GetLatestSingletonEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: CmsGraphQLClient.Interface,
        private fields: EntryGraphQLFields.Interface
    ) {}

    async execute(model: CmsModel) {
        const response = await this.client.execute<GetLatestSingletonEntryResponse>({
            query: createQuery(model, this.fields)
        });

        const { data, error } = response.content;

        if (!data) {
            return Result.fail(new CmsEntryError(error, "Could not fetch singleton entry"));
        }

        return Result.ok(data);
    }
}

export const GetLatestSingletonEntryGateway = GatewayAbstraction.createImplementation({
    implementation: GetLatestSingletonEntryGatewayImpl,
    dependencies: [CmsGraphQLClient, EntryGraphQLFields]
});
