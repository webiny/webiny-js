import { vi } from "vitest";
import type { Mock } from "vitest";
import type { ListAutomationDefinitionsUseCase } from "~/config/useCases/listAutomationDefinitions/abstractions.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";

export interface FakeListAutomationDefinitionsUseCase
    extends ListAutomationDefinitionsUseCase.Interface {
    execute: Mock<ListAutomationDefinitionsUseCase.Interface["execute"]>;
}

// No automation; tests override the answer.
export const createFakeListAutomationDefinitionsUseCase =
    (): FakeListAutomationDefinitionsUseCase => {
        const none: AutomationDefinition[] = [];
        return { execute: vi.fn().mockResolvedValue(none) };
    };
