import { vi } from "vitest";
import type { Mock } from "vitest";
import type { ListAiToolsUseCase } from "~/config/useCases/listAiTools/abstractions.js";
import type { AiTool } from "~/editor/domain/types.js";

export interface FakeListAiToolsUseCase extends ListAiToolsUseCase.Interface {
    execute: Mock<ListAiToolsUseCase.Interface["execute"]>;
}

// No AI tool; tests override the answer.
export const createFakeListAiToolsUseCase = (): FakeListAiToolsUseCase => {
    const none: AiTool[] = [];
    return { execute: vi.fn().mockResolvedValue(none) };
};
