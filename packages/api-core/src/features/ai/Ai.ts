import { createImplementation } from "@webiny/feature/api";
import { generateText } from "ai";
import { streamText } from "ai";
import { Ai as AiAbstraction } from "./abstractions.js";
import { AiSdkFactory } from "./abstractions.js";
import { AiConnection } from "./abstractions.js";
import { AiConnectionFactory } from "./abstractions.js";
import type { AiGenerateTextParams } from "./abstractions.js";
import type { AiStreamTextParams } from "./abstractions.js";
import type { IAiSdk } from "./abstractions.js";
import type { IAiConnection } from "./abstractions.js";
import type { LanguageModel } from "ai";

class AiImpl implements AiAbstraction.Interface {
    private sdkCache = new Map<string, IAiSdk>();
    private resolvedConnections: IAiConnection[] | null = null;

    constructor(
        private readonly factories: AiSdkFactory.Interface[],
        private readonly staticConnections: AiConnection.Interface[],
        private readonly connectionFactories: AiConnectionFactory.Interface[]
    ) {}

    generateText(params: AiGenerateTextParams): ReturnType<typeof generateText> {
        const { model, connection, ...rest } = params;
        return this.resolveLanguageModel(model, connection).then(resolvedModel => {
            // Cast required: spreading the discriminated Prompt union loses its narrowing.
            return generateText({ model: resolvedModel, ...rest } as Parameters<
                typeof generateText
            >[0]);
        });
    }

    async listModels(connection?: string | IAiConnection): Promise<string[]> {
        if (connection !== undefined) {
            const conn = await this.resolveNamedConnection(connection);
            const sdk = await this.getSdk(conn);
            return sdk.listModels().map(m => `${conn.sdkName}/${m}`);
        }

        const connections = await this.getConnections();
        const results = await Promise.all(
            connections.map(async conn => {
                const sdk = await this.getSdk(conn);
                return sdk.listModels().map(m => `${conn.sdkName}/${m}`);
            })
        );
        return results.flat();
    }

    async streamText(params: AiStreamTextParams): Promise<ReturnType<typeof streamText>> {
        const { model, connection, ...rest } = params;
        const resolvedModel = await this.resolveLanguageModel(model, connection);
        // Cast required: spreading the discriminated Prompt union loses its narrowing.
        return streamText({ model: resolvedModel, ...rest } as Parameters<typeof streamText>[0]);
    }

    private async resolveLanguageModel(
        modelId: string,
        connection?: string | IAiConnection
    ): Promise<LanguageModel> {
        const slashIndex = modelId.indexOf("/");
        if (slashIndex === -1) {
            throw new Error(
                `Invalid model ID "${modelId}". Expected format: "<sdkName>/<modelId>" (e.g. "openai/gpt-4o").`
            );
        }

        const sdkName = modelId.slice(0, slashIndex);
        const modelName = modelId.slice(slashIndex + 1);

        const resolvedConnection = await this.resolveConnection(sdkName, connection);
        const sdk = await this.getSdk(resolvedConnection);
        return sdk.languageModel(modelName);
    }

    private async getConnections(): Promise<IAiConnection[]> {
        if (this.resolvedConnections) {
            return this.resolvedConnections;
        }
        const fromFactories = await Promise.all(
            this.connectionFactories.map(factory => factory.execute())
        );
        this.resolvedConnections = [...this.staticConnections, ...fromFactories];
        return this.resolvedConnections;
    }

    private async resolveConnection(
        sdkName: string,
        connection?: string | IAiConnection
    ): Promise<IAiConnection> {
        if (connection !== undefined) {
            return this.resolveNamedConnection(connection);
        }

        const connections = await this.getConnections();
        const found = connections.find(c => c.sdkName === sdkName);
        if (!found) {
            const known = connections.map(c => `"${c.id}" (${c.sdkName})`).join(", ");
            throw new Error(
                `No AI connection found for SDK "${sdkName}". Registered connections: ${known}.`
            );
        }
        return found;
    }

    private async resolveNamedConnection(connection: string | IAiConnection): Promise<IAiConnection> {
        if (typeof connection === "object") {
            return connection;
        }

        const connections = await this.getConnections();
        const found = connections.find(c => c.id === connection);
        if (!found) {
            const known = connections.map(c => `"${c.id}"`).join(", ");
            throw new Error(
                `Unknown AI connection "${connection}". Registered connections: ${known}.`
            );
        }
        return found;
    }

    private async getSdk(connection: IAiConnection): Promise<IAiSdk> {
        const cached = this.sdkCache.get(connection.id);
        if (cached) {
            return cached;
        }

        const factory = this.factories.find(f => f.name === connection.sdkName);
        if (!factory) {
            const known = this.factories.map(f => `"${f.name}"`).join(", ");
            throw new Error(
                `No AI SDK factory found for "${connection.sdkName}". Registered factories: ${known}.`
            );
        }

        const sdk = await factory.execute(connection.apiKey);
        this.sdkCache.set(connection.id, sdk);
        return sdk;
    }
}

export const Ai = createImplementation({
    abstraction: AiAbstraction,
    implementation: AiImpl,
    dependencies: [
        [AiSdkFactory, { multiple: true }],
        [AiConnection, { multiple: true }],
        [AiConnectionFactory, { multiple: true }]
    ]
});
