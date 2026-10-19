import { Container } from "@webiny/di";
import { createFakeConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import type { FakeWorkflowConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import { createFakeEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import type { FakeWorkflowEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import { WorkflowEditorToasts } from "~/editor/toasts/abstractions.js";
import { WorkflowConfigUseCases } from "~/editor/useCases/abstractions.js";
import { ExclusionDialogPresenter } from "~/settings/presentation/exclusionDialog/abstractions.js";
import { ExclusionDialogPresenterFeature } from "~/settings/presentation/exclusionDialog/feature.js";
import { WorkflowSettingsUseCases } from "~/settings/useCases/abstractions.js";
import { createFakeSettingsUseCases } from "./fakeWorkflowSettingsUseCases.js";
import type { FakeWorkflowSettingsUseCases } from "./fakeWorkflowSettingsUseCases.js";

export interface ExclusionDialogSetup {
    presenter: ExclusionDialogPresenter.Interface;
    settings: FakeWorkflowSettingsUseCases;
    config: FakeWorkflowConfigUseCases;
    toasts: FakeWorkflowEditorToasts;
}

// An Add / Edit dialog presenter over fakes; `updateSettings` echoes the list it was sent.
export const createExclusionDialogSetup = (): ExclusionDialogSetup => {
    const settings = createFakeSettingsUseCases();
    settings.updateSettings.mockImplementation(async data => data);
    const config = createFakeConfigUseCases();
    const toasts = createFakeEditorToasts();

    const container = new Container();
    container.registerInstance(WorkflowSettingsUseCases, settings);
    container.registerInstance(WorkflowConfigUseCases, config);
    container.registerInstance(WorkflowEditorToasts, toasts);
    ExclusionDialogPresenterFeature.register(container);
    const presenter = container.resolve(ExclusionDialogPresenter);

    return { presenter, settings, config, toasts };
};
