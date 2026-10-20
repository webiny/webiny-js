import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { createFakeConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import type { FakeWorkflowConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import { createFakeEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import type { FakeWorkflowEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import { WorkflowEditorToasts } from "~/editor/toasts/abstractions.js";
import { WorkflowConfigUseCases } from "~/editor/useCases/abstractions.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import { ExclusionDialogPresenter } from "~/settings/presentation/exclusionDialog/abstractions.js";
import { ExclusionDialogPresenterFeature } from "~/settings/presentation/exclusionDialog/feature.js";
import { UpdateWorkflowSettingsUseCase } from "~/settings/useCases/updateWorkflowSettings/abstractions.js";

export interface FakeUpdateWorkflowSettingsUseCase {
    execute: Mock<UpdateWorkflowSettingsUseCase.Interface["execute"]>;
}

export interface ExclusionDialogSetup {
    presenter: ExclusionDialogPresenter.Interface;
    updateWorkflowSettings: FakeUpdateWorkflowSettingsUseCase;
    config: FakeWorkflowConfigUseCases;
    toasts: FakeWorkflowEditorToasts;
}

// The server returns the saved record (A108); the fake answers the list it was sent.
const echoSettings = (settings: WorkflowSettings): Promise<WorkflowSettings> => {
    return Promise.resolve(settings);
};

// An Add / Edit dialog presenter over one fake per injected use case (R355).
export const createExclusionDialogSetup = (): ExclusionDialogSetup => {
    const updateWorkflowSettings: FakeUpdateWorkflowSettingsUseCase = {
        execute: vi.fn(echoSettings)
    };
    const config = createFakeConfigUseCases();
    const toasts = createFakeEditorToasts();

    const container = new Container();
    container.registerInstance(UpdateWorkflowSettingsUseCase, updateWorkflowSettings);
    container.registerInstance(WorkflowConfigUseCases, config);
    container.registerInstance(WorkflowEditorToasts, toasts);
    ExclusionDialogPresenterFeature.register(container);
    const presenter = container.resolve(ExclusionDialogPresenter);

    return { presenter, updateWorkflowSettings, config, toasts };
};
