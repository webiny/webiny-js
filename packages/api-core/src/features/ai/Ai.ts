import { createImplementation } from "@webiny/feature/api";
import { generateText } from "ai";
import { streamText } from "ai";
import { Ai as AiAbstraction } from "./abstractions.js";
import { AiSdkFactory } from "./abstractions.js";
import { AiConnectionFactory } from "./abstractions.js";
import type { AiGenerateTextParams, AiModel, IAiSdkFactory } from "./abstractions.js";
import type { AiStreamTextParams } from "./abstractions.js";
import type { IAiSdk } from "./abstractions.js";
import type { IAiConnection } from "./abstractions.js";
import type { IAiConnectionInline } from "./abstractions.js";
import type { LanguageModel } from "ai";

function toAiModel(factory: IAiSdkFactory, modelId: string, modelName: string): AiModel {
    return {
        providerId: factory.id,
        providerName: factory.name,
        modelId,
        modelName
    };
}

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

    listModels(): Promise<AiModel[]> {
        return Promise.resolve(
            this.sdkFactories.flatMap(factory =>
                factory.models.map(m => toAiModel(factory, m.id, m.name))
            )
        );
    }

    async listModelsByConnections(): Promise<AiModel[]> {
        const connections = await this.getConnections();
        return connections.flatMap(conn => {
            const factory = this.sdkFactories.find(f => f.id === conn.sdkName);
            if (!factory) {
                return [];
            }
            return factory.models.map(m => toAiModel(factory, m.id, m.name));
        });
    }

    async listModelsByConnection(connection: string | IAiConnectionInline): Promise<AiModel[]> {
        const conn = await this.resolveConnection(undefined, connection);
        const factory = this.sdkFactories.find(f => f.id === conn.sdkName);
        if (!factory) {
            return [];
        }
        return factory.models.map(m => toAiModel(factory, m.id, m.name));
    }

    private async resolveLanguageModel(
        modelId: string,
        connection?: string | IAiConnectionInline
    ): Promise<LanguageModel> {
        const slashIndex = modelId.indexOf("/");
        if (slashIndex === -1) {
            throw new Error(
                `Invalid model ID "${modelId}". Expected format: "<providerId>/<modelId>" (e.g. "openai/gpt-4o").`
            );
        }

        const providerId = modelId.slice(0, slashIndex);
        const modelName = modelId.slice(slashIndex + 1);

        const conn = await this.resolveConnection(providerId, connection);
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
        providerId: string | undefined,
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

        const found = connections.find(c => c.sdkName === providerId);
        if (!found) {
            const known = connections.map(c => `"${c.id}" (${c.sdkName})`).join(", ");
            throw new Error(
                `No AI connection found for provider "${providerId}". Registered connections: ${known}.`
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

        const factory = this.sdkFactories.find(f => f.id === connection.sdkName);
        if (!factory) {
            const known = this.sdkFactories.map(f => `"${f.id}"`).join(", ");
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
