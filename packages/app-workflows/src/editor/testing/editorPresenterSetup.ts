import { Container } from "@webiny/di";
import type { IPermission } from "@webiny/app-admin/domain/Identity.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { createFakeListAiModelsUseCase } from "~/config/testing/fakeListAiModelsUseCase.js";
import type { FakeListAiModelsUseCase } from "~/config/testing/fakeListAiModelsUseCase.js";
import { createFakeListAiToolsUseCase } from "~/config/testing/fakeListAiToolsUseCase.js";
import type { FakeListAiToolsUseCase } from "~/config/testing/fakeListAiToolsUseCase.js";
import { createFakeListAutomationDefinitionsUseCase } from "~/config/testing/fakeListAutomationDefinitionsUseCase.js";
import type { FakeListAutomationDefinitionsUseCase } from "~/config/testing/fakeListAutomationDefinitionsUseCase.js";
import { createFakeListNotificationTransportsUseCase } from "~/config/testing/fakeListNotificationTransportsUseCase.js";
import type { FakeListNotificationTransportsUseCase } from "~/config/testing/fakeListNotificationTransportsUseCase.js";
import { createFakeListStepTypesUseCase } from "~/config/testing/fakeListStepTypesUseCase.js";
import type { FakeListStepTypesUseCase } from "~/config/testing/fakeListStepTypesUseCase.js";
import { createFakeListWorkflowTeamsUseCase } from "~/config/testing/fakeListWorkflowTeamsUseCase.js";
import type { FakeListWorkflowTeamsUseCase } from "~/config/testing/fakeListWorkflowTeamsUseCase.js";
import { createFakeListWorkflowUsersUseCase } from "~/config/testing/fakeListWorkflowUsersUseCase.js";
import type { FakeListWorkflowUsersUseCase } from "~/config/testing/fakeListWorkflowUsersUseCase.js";
import { ListAiModelsUseCase } from "~/config/useCases/listAiModels/abstractions.js";
import { ListAiToolsUseCase } from "~/config/useCases/listAiTools/abstractions.js";
import { ListAutomationDefinitionsUseCase } from "~/config/useCases/listAutomationDefinitions/abstractions.js";
import { ListNotificationTransportsUseCase } from "~/config/useCases/listNotificationTransports/abstractions.js";
import { ListStepTypesUseCase } from "~/config/useCases/listStepTypes/abstractions.js";
import { ListWorkflowTeamsUseCase } from "~/config/useCases/listWorkflowTeams/abstractions.js";
import { ListWorkflowUsersUseCase } from "~/config/useCases/listWorkflowUsers/abstractions.js";
import type { WorkflowTeamList } from "~/editor/domain/types.js";
import { WorkflowEditorPresenter } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowEditorInitParams } from "~/editor/presentation/editor/abstractions.js";
import { WorkflowEditorPresenterFeature } from "~/editor/presentation/editor/feature.js";
import { createStepTypes } from "~/editor/testing/draftFixtures.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createAiModel } from "~/editor/testing/editorFixtures.js";
import { createAiTool } from "~/editor/testing/editorFixtures.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";
import { createFakeEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import type { FakeWorkflowEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import { createFakeEditorUseCases } from "~/editor/testing/fakeWorkflowEditorUseCases.js";
import type { FakeWorkflowEditorUseCases } from "~/editor/testing/fakeWorkflowEditorUseCases.js";
import type { WorkflowEditorAppKind } from "~/editor/model/getStepTypeOptions.js";
import { createFakeAppAdapter } from "~/editor/testing/fakeEditorAppAdapter.js";
import type { FakeEditorAppAdapter } from "~/editor/testing/fakeEditorAppAdapter.js";
import { WorkflowEditorToasts } from "~/editor/toasts/abstractions.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
import type { FakeReviewUseCases } from "~/review/testing/fakeReviewUseCases.js";
import { createWorkflowsIdentityContext } from "~/review/testing/createWorkflowsIdentityContext.js";

export interface EditorPresenterSetupOptions {
    // Whether the viewer has the workflows `editor` permission; default true.
    editor?: boolean;
    reassign?: boolean;
    appKind?: WorkflowEditorAppKind;
}

export interface EditorPresenterSetup {
    presenter: WorkflowEditorPresenter.Interface;
    container: Container;
    useCases: FakeWorkflowEditorUseCases;
    listStepTypes: FakeListStepTypesUseCase;
    listAutomationDefinitions: FakeListAutomationDefinitionsUseCase;
    listNotificationTransports: FakeListNotificationTransportsUseCase;
    listAiModels: FakeListAiModelsUseCase;
    listAiTools: FakeListAiToolsUseCase;
    listWorkflowTeams: FakeListWorkflowTeamsUseCase;
    listWorkflowUsers: FakeListWorkflowUsersUseCase;
    toasts: FakeWorkflowEditorToasts;
    reviewUseCases: FakeReviewUseCases;
    app: FakeEditorAppAdapter;
    params: WorkflowEditorInitParams;
}

/*
 * A presenter with one fake per injected use case (R355) and fakes for everything else it talks
 * to. Defaults: the viewer is an editor; one model row `Article` bound to the workflow `Article
 * review` with one People step on the team `Editors` (Task 5's fakes); all three step types, the AI
 * editor present with one model and one tool; one automation covering every model; the e-mail
 * transport; one team; no user.
 */
export const createEditorPresenterSetup = (
    options: EditorPresenterSetupOptions = {}
): EditorPresenterSetup => {
    const permission: IPermission = {
        name: "workflows",
        editor: options.editor ?? true,
        reassign: options.reassign ?? false
    };
    const useCases = createFakeEditorUseCases();

    const stepTypes = createStepTypes();
    const listStepTypes = createFakeListStepTypesUseCase();
    listStepTypes.execute.mockResolvedValue(stepTypes);

    const webhookAutomation = createWebhookAutomation();
    const listAutomationDefinitions = createFakeListAutomationDefinitionsUseCase();
    listAutomationDefinitions.execute.mockResolvedValue([webhookAutomation]);

    const listNotificationTransports = createFakeListNotificationTransportsUseCase();

    const aiModel = createAiModel();
    const listAiModels = createFakeListAiModelsUseCase();
    listAiModels.execute.mockResolvedValue([aiModel]);

    const aiTool = createAiTool();
    const listAiTools = createFakeListAiToolsUseCase();
    listAiTools.execute.mockResolvedValue([aiTool]);

    const team = createWorkflowTeamSummary();
    const teamList: WorkflowTeamList = { teams: [team], missingIds: [] };
    const listWorkflowTeams = createFakeListWorkflowTeamsUseCase();
    listWorkflowTeams.execute.mockResolvedValue(teamList);

    const listWorkflowUsers = createFakeListWorkflowUsersUseCase();

    const toasts = createFakeEditorToasts();
    const reviewUseCases = createFakeUseCases();
    const app = createFakeAppAdapter(options.appKind ?? "cms");

    const identityContext = createWorkflowsIdentityContext({ permissions: [permission] });
    const container = new Container();
    container.registerInstance(IdentityContext, identityContext);
    container.registerInstance(ListStepTypesUseCase, listStepTypes);
    container.registerInstance(ListAutomationDefinitionsUseCase, listAutomationDefinitions);
    container.registerInstance(ListNotificationTransportsUseCase, listNotificationTransports);
    container.registerInstance(ListAiModelsUseCase, listAiModels);
    container.registerInstance(ListAiToolsUseCase, listAiTools);
    container.registerInstance(ListWorkflowTeamsUseCase, listWorkflowTeams);
    container.registerInstance(ListWorkflowUsersUseCase, listWorkflowUsers);
    container.registerInstance(WorkflowEditorToasts, toasts);
    WorkflowEditorPresenterFeature.register(container);
    const presenter = container.resolve(WorkflowEditorPresenter);

    const params: WorkflowEditorInitParams = { useCases, reviewUseCases, app };

    return {
        presenter,
        container,
        useCases,
        listStepTypes,
        listAutomationDefinitions,
        listNotificationTransports,
        listAiModels,
        listAiTools,
        listWorkflowTeams,
        listWorkflowUsers,
        toasts,
        reviewUseCases,
        app,
        params
    };
};
