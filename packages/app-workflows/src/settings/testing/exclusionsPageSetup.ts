import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { createFakeConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import type { FakeWorkflowConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import { WorkflowConfigUseCases } from "~/editor/useCases/abstractions.js";
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import { ExclusionsPagePresenter } from "~/settings/presentation/exclusionsPage/abstractions.js";
import { ExclusionsPagePresenterFeature } from "~/settings/presentation/exclusionsPage/feature.js";
import { GetWorkflowSettingsUseCase } from "~/settings/useCases/getWorkflowSettings/abstractions.js";

export interface FakeGetWorkflowSettingsUseCase {
    execute: Mock<GetWorkflowSettingsUseCase.Interface["execute"]>;
}

export interface ExclusionsPageSetup {
    presenter: ExclusionsPagePresenter.Interface;
    getWorkflowSettings: FakeGetWorkflowSettingsUseCase;
    config: FakeWorkflowConfigUseCases;
}

/*
 * A page presenter over one fake per injected use case (R355): `getWorkflowSettings` resolves
 * `{ exclusions }` (the same array every time, so a test can check that the page keeps it), and
 * `listUsers` finds nobody.
 */
export const createExclusionsPageSetup = (
    exclusions: WorkflowExclusion[] = []
): ExclusionsPageSetup => {
    const getWorkflowSettings: FakeGetWorkflowSettingsUseCase = {
        execute: vi.fn().mockResolvedValue({ exclusions })
    };
    const config = createFakeConfigUseCases();

    const container = new Container();
    container.registerInstance(GetWorkflowSettingsUseCase, getWorkflowSettings);
    container.registerInstance(WorkflowConfigUseCases, config);
    ExclusionsPagePresenterFeature.register(container);
    const presenter = container.resolve(ExclusionsPagePresenter);

    return { presenter, getWorkflowSettings, config };
};
