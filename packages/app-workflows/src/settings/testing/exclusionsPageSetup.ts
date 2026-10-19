import { Container } from "@webiny/di";
import { createFakeConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import type { FakeWorkflowConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import { WorkflowConfigUseCases } from "~/editor/useCases/WorkflowConfigUseCases.js";
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import { ExclusionsPagePresenter } from "~/settings/presentation/exclusionsPage/abstractions.js";
import { ExclusionsPagePresenterFeature } from "~/settings/presentation/exclusionsPage/feature.js";
import { WorkflowSettingsUseCases } from "~/settings/useCases/WorkflowSettingsUseCases.js";
import { createFakeSettingsUseCases } from "./fakeWorkflowSettingsUseCases.js";
import type { FakeWorkflowSettingsUseCases } from "./fakeWorkflowSettingsUseCases.js";

export interface ExclusionsPageSetup {
    presenter: ExclusionsPagePresenter.Interface;
    settings: FakeWorkflowSettingsUseCases;
    config: FakeWorkflowConfigUseCases;
}

/*
 * A page presenter over fakes: `getSettings` resolves `{ exclusions }` (the same array every time,
 * so a test can check that the page keeps it), and `listUsers` finds nobody.
 */
export const createExclusionsPageSetup = (
    exclusions: WorkflowExclusion[] = []
): ExclusionsPageSetup => {
    const settings = createFakeSettingsUseCases();
    settings.getSettings.mockResolvedValue({ exclusions });
    settings.updateSettings.mockResolvedValue({ exclusions });
    const config = createFakeConfigUseCases();

    const container = new Container();
    container.registerInstance(WorkflowSettingsUseCases, settings);
    container.registerInstance(WorkflowConfigUseCases, config);
    ExclusionsPagePresenterFeature.register(container);
    const presenter = container.resolve(ExclusionsPagePresenter);

    return { presenter, settings, config };
};
