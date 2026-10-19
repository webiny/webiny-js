import type { Container } from "@webiny/di";
import { vi } from "vitest";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import type { AiModel } from "@webiny/api-core/features/ai/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";

export const createAiModel = (providerId: string, modelId: string): AiModel => {
    return {
        providerId,
        providerName: `${providerId} provider`,
        modelId,
        modelName: `${modelId} name`,
        deprecated: undefined,
        endOfLife: undefined,
        supports: undefined
    };
};

/**
 * Registers a fake `Ai` whose `listModels` answers `models` (or throws when given an `Error`).
 * No model is ever called: `generateText` and `streamText` throw, and so does
 * `listModelsByConnections` (it reads `AiConnectionFactory` registrations nothing registers, R169),
 * which makes a use of it a visible failure instead of an empty list.
 */
export const registerFakeAi = (container: Container, models: AiModel[] | Error): void => {
    class FakeAi implements Ai.Interface {
        public async generateText(): Promise<never> {
            throw new Error("The fake Ai does not generate text.");
        }

        public async streamText(): Promise<never> {
            throw new Error("The fake Ai does not stream text.");
        }

        public async listModels(): Promise<AiModel[]> {
            if (models instanceof Error) {
                throw models;
            }
            return models;
        }

        public async listModelsByConnections(): Promise<AiModel[]> {
            throw new Error("listModelsByConnections must not be used (R169).");
        }

        public async listModelsByConnection(): Promise<AiModel[]> {
            throw new Error("listModelsByConnection must not be used (R169).");
        }
    }
    container.register(Ai.createImplementation({ implementation: FakeAi, dependencies: [] }));
};

/** Registers a `Logger` whose `error` is a spy, so a test can count and read what was logged. */
export const registerFakeLogger = (container: Container) => {
    const error = vi.fn();
    container.registerInstance(Logger, {
        trace: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error,
        fatal: vi.fn(),
        log: vi.fn()
    } as unknown as Logger.Interface);
    return { error };
};
