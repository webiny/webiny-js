import { ApiStreamClient, readServerSentEvents } from "@webiny/app/exports/admin.js";
import { ReenrichFileGateway as GatewayAbstraction } from "./abstractions.js";
import type { EnrichmentStreamEvent, IReenrichFileOptions } from "./abstractions.js";

class ReenrichFileGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: ApiStreamClient.Interface) {}

    async *execute(
        fileId: string,
        options: IReenrichFileOptions = {}
    ): AsyncGenerator<EnrichmentStreamEvent> {
        const response = await this.client.execute({
            path: `/stream/fm/files/${encodeURIComponent(fileId)}/enrich`,
            method: "POST",
            signal: options.signal
        });

        yield* readServerSentEvents<EnrichmentStreamEvent>(response);
    }
}

export const ReenrichFileGateway = GatewayAbstraction.createImplementation({
    implementation: ReenrichFileGatewayImpl,
    dependencies: [ApiStreamClient]
});
