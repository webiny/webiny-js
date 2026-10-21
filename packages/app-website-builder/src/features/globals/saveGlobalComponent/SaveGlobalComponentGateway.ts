import type { GlobalComponentRecord } from "@webiny/website-builder-sdk";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { SaveGlobalComponentGateway as GatewayAbstraction } from "./abstractions.js";

type SaveGlobalComponentResponse = {
    websiteBuilder: {
        saveGlobalComponent:
            | { data: GlobalComponentRecord; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

const SAVE_GLOBAL_COMPONENT = /* GraphQL */ `
    mutation SaveGlobalComponent(
        $name: String!
        $language: String
        $data: WbGlobalComponentInput!
    ) {
        websiteBuilder {
            saveGlobalComponent(name: $name, language: $language, data: $data) {
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

class SaveGlobalComponentGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(globalComponent: GlobalComponentRecord): Promise<GlobalComponentRecord> {
        const response = await this.client.execute<SaveGlobalComponentResponse>({
            query: SAVE_GLOBAL_COMPONENT,
            variables: {
                name: globalComponent.name,
                language: globalComponent.language,
                data: { elements: globalComponent.elements, bindings: globalComponent.bindings }
            }
        });

        const envelope = response.websiteBuilder.saveGlobalComponent;
        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not save the global component.");
        }

        return envelope.data;
    }
}

export const SaveGlobalComponentGateway = GatewayAbstraction.createImplementation({
    implementation: SaveGlobalComponentGatewayImpl,
    dependencies: [MainGraphQLClient]
});
