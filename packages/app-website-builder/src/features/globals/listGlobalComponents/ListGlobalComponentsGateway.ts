import type { GlobalComponentRecord } from "@webiny/website-builder-sdk";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { ListGlobalComponentsGateway as GatewayAbstraction } from "./abstractions.js";

type ListGlobalComponentsResponse = {
    websiteBuilder: {
        listGlobalComponents:
            | { data: GlobalComponentRecord[]; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

const LIST_GLOBAL_COMPONENTS = /* GraphQL */ `
    query ListGlobalComponents($language: String, $fallback: Boolean) {
        websiteBuilder {
            listGlobalComponents(language: $language, fallback: $fallback) {
                data {
                    name
                    language
                    elements
                    bindings
                }
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;

class ListGlobalComponentsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: GatewayAbstraction.Params) {
        const response = await this.client.execute<ListGlobalComponentsResponse>({
            query: LIST_GLOBAL_COMPONENTS,
            variables: { language: params.language, fallback: params.fallback ?? false }
        });

        const envelope = response.websiteBuilder.listGlobalComponents;
        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not list the global components.");
        }

        return envelope.data;
    }
}

export const ListGlobalComponentsGateway = GatewayAbstraction.createImplementation({
    implementation: ListGlobalComponentsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
