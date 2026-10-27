import { vi } from "vitest";
import type { Mock } from "vitest";
import type { ListAiModelsUseCase } from "~/config/useCases/listAiModels/abstractions.js";
import type { AiModel } from "~/editor/domain/types.js";

export interface FakeListAiModelsUseCase extends ListAiModelsUseCase.Interface {
    execute: Mock<ListAiModelsUseCase.Interface["execute"]>;
}

// No AI model; tests override the answer.
export const createFakeListAiModelsUseCase = (): FakeListAiModelsUseCase => {
    const none: AiModel[] = [];
    return { execute: vi.fn().mockResolvedValue(none) };
};
