import { createImplementation } from "@webiny/feature/api";
import { generateText } from "ai";
import { streamText } from "ai";
import { Ai as AiAbstraction } from "./abstractions.js";
import { AiSdkFactory } from "./abstractions.js";
import { AiConnectionFactory } from "./abstractions.js";
import { AiModelRegistry } from "./abstractions.js";
import type { AiGenerateTextParams, AiModel } from "./abstractions.js";
import type { AiStreamTextParams } from "./abstractions.js";
import type { IAiSdk } from "./abstractions.js";
import type { IAiConnection } from "./abstractions.js";
import type { IAiConnectionInline } from "./abstractions.js";
import type { LanguageModel } from "ai";
import { mdbid } from "@webiny/utils/mdbid.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import {
    AiBeforeGenerateTextEvent,
    AiAfterGenerateTextEvent,
    AiGenerateTextErrorEvent,
    AiBeforeStreamTextEvent,
    AiAfterStreamTextEvent,
    AiStreamTextErrorEvent
} from "./events.js";

/**
 * Drops call options the model doesn't accept. Several current models reject `temperature` outright
 * (a 400, not a warning), so it is only sent when the catalog says the model supports it. No
 * information counts as unsupported: leaving it out costs some determinism, sending it can fail the
 * whole request.
 */
const withSupportedOptions = <T extends { temperature?: number }>(
    options: T,
    model: AiModel
): T => {
    if (options.temperature === undefined || model.supports?.temperature === true) {
        return options;
    }
    const { temperature: _temperature, ...rest } = options;
    return rest as T;
};

class AiImpl implements AiAbstraction.Interface {
    private sdkCache = new Map<string, IAiSdk>();
    private resolvedConnections: IAiConnection[] | null = null;

    constructor(
        private readonly sdkFactories: AiSdkFactory.Interface[],
        private readonly connectionFactories: AiConnectionFactory.Interface[],
        private readonly eventPublisher: EventPublisher.Interface,
        private readonly modelRegistry: AiModelRegistry.Interface
    ) {}

    async generateText(params: AiGenerateTextParams): ReturnType<typeof generateText> {
        const { model, connection, ...options } = params;
        const { languageModel: resolvedModel, model: catalogModel } =
            await this.resolveLanguageModel(model, connection);
        const rest = withSupportedOptions(options, catalogModel);
        const requestId = mdbid();

        await this.eventPublisher.publish(new AiBeforeGenerateTextEvent({ requestId, params }));

        const start = performance.now();

        try {
            const result = await generateText({ model: resolvedModel, ...rest } as Parameters<
                typeof generateText
            >[0]);

            const duration = performance.now() - start;

            await this.eventPublisher.publish(
                new AiAfterGenerateTextEvent({ requestId, params, result, duration })
            );

            return result;
        } catch (err) {
            const duration = performance.now() - start;
            const error = err instanceof Error ? err : new Error(String(err));

            await this.eventPublisher.publish(
                new AiGenerateTextErrorEvent({ requestId, params, error, duration })
            );

            throw err;
        }
    }

    async streamText(params: AiStreamTextParams): Promise<ReturnType<typeof streamText>> {
        const { model, connection, ...options } = params;
        const { languageModel: resolvedModel, model: catalogModel } =
            await this.resolveLanguageModel(model, connection);
        const rest = withSupportedOptions(options, catalogModel);

        await this.eventPublisher.publish(new AiBeforeStreamTextEvent({ params }));

        const requestId = mdbid();
        const start = performance.now();
        const { onEnd, onFinish, onError, onAbort } = rest as {
            onEnd?: (event: unknown) => unknown;
            onFinish?: (event: unknown) => unknown;
            onError?: (event: { error: unknown }) => unknown;
            onAbort?: (event: unknown) => unknown;
        };
        // One call ends once: finished, or failed. Whichever is seen first is published.
        let settled = false;
        const settle = async (publish: () => Promise<void>) => {
            if (settled) {
                return;
            }
            settled = true;
            await publish();
        };
        const failed = (error: unknown) =>
            settle(() =>
                this.eventPublisher.publish(
                    new AiStreamTextErrorEvent({
                        requestId,
                        params,
                        error: error instanceof Error ? error : new Error(String(error)),
                        duration: performance.now() - start
                    })
                )
            );

        // Cast required: spreading the discriminated Prompt union loses its narrowing.
        const result = streamText({
            model: resolvedModel,
            ...rest,
            // The stream's own callbacks publish the after and error events `generateText` publishes,
            // so whoever records usage sees streamed calls too. The caller's callbacks run first.
            onEnd: async (event: unknown) => {
                await onEnd?.(event);
                await onFinish?.(event);
                const finished = event as {
                    totalUsage?: unknown;
                    usage?: unknown;
                    finishReason?: unknown;
                };
                await settle(() =>
                    this.eventPublisher.publish(
                        new AiAfterStreamTextEvent({
                            requestId,
                            params,
                            usage: finished.totalUsage ?? finished.usage,
                            finishReason: String(finished.finishReason ?? ""),
                            duration: performance.now() - start
                        })
                    )
                );
            },
            onError: async (event: { error: unknown }) => {
                await onError?.(event);
                await failed(event.error);
            },
            onAbort: async (event: unknown) => {
                await onAbort?.(event);
                await failed(new Error("The stream was aborted."));
            }
        } as Parameters<typeof streamText>[0]);

        /*
         * A provider request aborted mid-stream (a call cut off at its time limit) throws out of the
         * stream the caller reads, and the SDK calls none of the callbacks above. So the streams handed
         * to the caller are watched: an error there, or the caller cancelling, is the call failing.
         */
        const watch = <T>(stream: ReadableStream<T>): ReadableStream<T> => {
            const reader = stream.getReader();
            return new ReadableStream<T>({
                async pull(controller) {
                    try {
                        const { done, value } = await reader.read();
                        if (done) {
                            controller.close();
                        } else {
                            controller.enqueue(value);
                        }
                    } catch (error) {
                        await failed(error);
                        controller.error(error);
                    }
                },
                async cancel(reason) {
                    await failed(reason ?? new Error("The stream was cancelled."));
                    await reader.cancel(reason);
                }
            });
        };
        return new Proxy(result, {
            get(target, property, receiver) {
                const value = Reflect.get(target, property, receiver);
                if (property === "fullStream" || property === "textStream") {
                    return watch(value as ReadableStream<unknown>);
                }
                return typeof value === "function" ? value.bind(target) : value;
            }
        });
    }

    listModels(): Promise<AiModel[]> {
        return this.modelRegistry.listModels();
    }

    async listModelsByConnections(): Promise<AiModel[]> {
        const [connections, models] = await Promise.all([
            this.getConnections(),
            this.modelRegistry.listModels()
        ]);
        const connectedProviderIds = new Set(connections.map(c => c.sdkName));
        return models.filter(m => connectedProviderIds.has(m.providerId));
    }

    async listModelsByConnection(connection: string | IAiConnectionInline): Promise<AiModel[]> {
        const [conn, models] = await Promise.all([
            this.resolveConnection(undefined, connection),
            this.modelRegistry.listModels()
        ]);
        return models.filter(m => m.providerId === conn.sdkName);
    }

    private async resolveLanguageModel(
        modelId: string,
        connection?: string | IAiConnectionInline
    ): Promise<{ languageModel: LanguageModel; model: AiModel }> {
        const slashIndex = modelId.indexOf("/");
        if (slashIndex === -1) {
            throw new Error(
                `Invalid model ID "${modelId}". Expected format: "<providerId>/<modelId>" (e.g. "openai/gpt-4o").`
            );
        }

        const providerId = modelId.slice(0, slashIndex);
        const rawModelId = modelId.slice(slashIndex + 1);

        const models = await this.modelRegistry.listModels();
        const found = models.find(m => m.providerId === providerId && m.modelId === rawModelId);
        if (!found) {
            throw new Error(
                `Model "${modelId}" is not available. Use listModels() to see available models.`
            );
        }

        const conn = await this.resolveConnection(providerId, connection);
        const sdk = await this.getSdk(conn);
        return { languageModel: sdk.languageModel(rawModelId), model: found };
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
        [AiConnectionFactory, { multiple: true }],
        EventPublisher,
        AiModelRegistry
    ]
});
