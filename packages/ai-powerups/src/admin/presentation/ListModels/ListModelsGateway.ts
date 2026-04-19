import { ListModelsGateway as GatewayAbstraction } from "./abstractions.js";

class ListModelsGatewayImpl implements GatewayAbstraction.Interface {
    async execute(): Promise<string[]> {
        // Stub response — will be replaced with a real GQL query later.
        return ["claude-sonnet-4-20250514", "claude-haiku-4-5-20251001", "gpt-4o", "gpt-4o-mini"];
    }
}

export const ListModelsGateway = GatewayAbstraction.createImplementation({
    implementation: ListModelsGatewayImpl,
    dependencies: []
});
