import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { createFakeListWorkflowUsersUseCase } from "~/config/testing/fakeListWorkflowUsersUseCase.js";
import type { FakeListWorkflowUsersUseCase } from "~/config/testing/fakeListWorkflowUsersUseCase.js";
import { ListWorkflowUsersUseCase } from "~/config/useCases/listWorkflowUsers/abstractions.js";
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
    listWorkflowUsers: FakeListWorkflowUsersUseCase;
}

/*
 * A page presenter over one fake per injected use case (R355): `getWorkflowSettings` resolves
 * `{ exclusions }` (the same array every time, so a test can check that the page keeps it), and
 * `listWorkflowUsers` finds nobody.
 */
export const createExclusionsPageSetup = (
    exclusions: WorkflowExclusion[] = []
): ExclusionsPageSetup => {
    const getWorkflowSettings: FakeGetWorkflowSettingsUseCase = {
        execute: vi.fn().mockResolvedValue({ exclusions })
    };
    const listWorkflowUsers = createFakeListWorkflowUsersUseCase();

    const container = new Container();
    container.registerInstance(GetWorkflowSettingsUseCase, getWorkflowSettings);
    container.registerInstance(ListWorkflowUsersUseCase, listWorkflowUsers);
    ExclusionsPagePresenterFeature.register(container);
    const presenter = container.resolve(ExclusionsPagePresenter);

    return { presenter, getWorkflowSettings, listWorkflowUsers };
};
