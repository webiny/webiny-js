import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { createFakeListWorkflowUsersUseCase } from "~/config/testing/fakeListWorkflowUsersUseCase.js";
import type { FakeListWorkflowUsersUseCase } from "~/config/testing/fakeListWorkflowUsersUseCase.js";
import { createFakeEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import type { FakeWorkflowEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import { WorkflowEditorToasts } from "~/editor/toasts/abstractions.js";
import { ListWorkflowUsersUseCase } from "~/config/useCases/listWorkflowUsers/abstractions.js";
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
    listWorkflowUsers: FakeListWorkflowUsersUseCase;
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
    const listWorkflowUsers = createFakeListWorkflowUsersUseCase();
    const toasts = createFakeEditorToasts();

    const container = new Container();
    container.registerInstance(UpdateWorkflowSettingsUseCase, updateWorkflowSettings);
    container.registerInstance(ListWorkflowUsersUseCase, listWorkflowUsers);
    container.registerInstance(WorkflowEditorToasts, toasts);
    ExclusionDialogPresenterFeature.register(container);
    const presenter = container.resolve(ExclusionDialogPresenter);

    return { presenter, updateWorkflowSettings, listWorkflowUsers, toasts };
};
