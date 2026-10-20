import { vi } from "vitest";
import type { Mock } from "vitest";
import type { ListStepTypesUseCase } from "~/config/useCases/listStepTypes/abstractions.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import { createEditorStepType } from "~/editor/testing/editorFixtures.js";

export interface FakeListStepTypesUseCase extends ListStepTypesUseCase.Interface {
    execute: Mock<ListStepTypesUseCase.Interface["execute"]>;
}

// The three step types, all available and without a config schema; tests override the answer.
export const createFakeListStepTypesUseCase = (): FakeListStepTypesUseCase => {
    const review = createEditorStepType({ type: "review", title: "Review" });
    const automation = createEditorStepType({ type: "automation", title: "Automation" });
    const ai = createEditorStepType({ type: "ai", title: "AI" });
    const stepTypes: EditorStepType[] = [review, automation, ai];
    return { execute: vi.fn().mockResolvedValue(stepTypes) };
};
