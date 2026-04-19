import { createImplementation } from "@webiny/feature/api";
import { generateText } from "ai";
import { streamText } from "ai";
import { Ai as AiAbstraction } from "./abstractions.js";
import { AiSdkFactory } from "./abstractions.js";
import { AiConnectionFactory } from "./abstractions.js";
import type { AiGenerateTextParams } from "./abstractions.js";
import type { AiStreamTextParams } from "./abstractions.js";
import type { IAiSdk } from "./abstractions.js";
import type { IAiConnection } from "./abstractions.js";
import type { IAiConnectionInline } from "./abstractions.js";
import type { LanguageModel } from "ai";

class AiImpl implements AiAbstraction.Interface {
    private sdkCache = new Map<string, IAiSdk>();
    private resolvedConnections: IAiConnection[] | null = null;

    constructor(
        private readonly sdkFactories: AiSdkFactory.Interface[],
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

    async streamText(params: AiStreamTextParams): Promise<ReturnType<typeof streamText>> {
        const { model, connection, ...rest } = params;
        const resolvedModel = await this.resolveLanguageModel(model, connection);
        // Cast required: spreading the discriminated Prompt union loses its narrowing.
        return streamText({ model: resolvedModel, ...rest } as Parameters<typeof streamText>[0]);
    }

    async listModels(connection?: string | IAiConnectionInline): Promise<string[]> {
        if (connection !== undefined) {
            const conn = await this.resolveConnection(undefined, connection);
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

    private async resolveLanguageModel(
        modelId: string,
        connection?: string | IAiConnectionInline
    ): Promise<LanguageModel> {
        const slashIndex = modelId.indexOf("/");
        if (slashIndex === -1) {
            throw new Error(
                `Invalid model ID "${modelId}". Expected format: "<sdkName>/<modelId>" (e.g. "openai/gpt-4o").`
            );
        }

        const sdkName = modelId.slice(0, slashIndex);
        const modelName = modelId.slice(slashIndex + 1);

        const conn = await this.resolveConnection(sdkName, connection);
        const sdk = await this.getSdk(conn);
        return sdk.languageModel(modelName);
    }

    private async getConnections(): Promise<IAiConnection[]> {
        if (!this.resolvedConnections) {
            this.resolvedConnections = await Promise.all(
                this.connectionFactories.map(f => f.execute())
            );
        }
        return this.resolvedConnections;
    }

    private async resolveConnection(
        sdkName: string | undefined,
        connection?: string | IAiConnectionInline
    ): Promise<IAiConnectionInline> {
        if (typeof connection === "object") {
            return connection;
        }

        const connections = await this.getConnections();

        if (typeof connection === "string") {
            const found = connections.find(c => c.id === connection);
            if (!found) {
                const known = connections.map(c => `"${c.id}"`).join(", ");
                throw new Error(
                    `Unknown AI connection "${connection}". Registered connections: ${known}.`
                );
            }
            return found;
        }

        const found = connections.find(c => c.sdkName === sdkName);
        if (!found) {
            const known = connections.map(c => `"${c.id}" (${c.sdkName})`).join(", ");
            throw new Error(
                `No AI connection found for SDK "${sdkName}". Registered connections: ${known}.`
            );
        }
        return found;
    }

    private async getSdk(connection: IAiConnectionInline): Promise<IAiSdk> {
        const cacheKey =
            "id" in connection
                ? (connection as IAiConnection).id
                : `${connection.sdkName}:${connection.apiKey ?? "__env__"}`;

        const cached = this.sdkCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const factory = this.sdkFactories.find(f => f.name === connection.sdkName);
        if (!factory) {
            const known = this.sdkFactories.map(f => `"${f.name}"`).join(", ");
            throw new Error(
                `No AI SDK factory found for "${connection.sdkName}". Registered factories: ${known}.`
            );
        }

        const sdk = await factory.execute(connection.apiKey);
        this.sdkCache.set(cacheKey, sdk);
        return sdk;
    }
}

export const Ai = createImplementation({
    abstraction: AiAbstraction,
    implementation: AiImpl,
    dependencies: [
        [AiSdkFactory, { multiple: true }],
        [AiConnectionFactory, { multiple: true }]
    ]
});
