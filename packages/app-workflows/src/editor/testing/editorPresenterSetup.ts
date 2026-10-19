import { Container } from "@webiny/di";
import type { IPermission } from "@webiny/app-admin/domain/Identity.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { WorkflowEditorPresenter } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowEditorInitParams } from "~/editor/presentation/editor/abstractions.js";
import { WorkflowEditorPresenterFeature } from "~/editor/presentation/editor/feature.js";
import { createStepTypes } from "~/editor/testing/draftFixtures.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createAiModel } from "~/editor/testing/editorFixtures.js";
import { createAiTool } from "~/editor/testing/editorFixtures.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";
import { createFakeConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import type { FakeWorkflowConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import { createFakeEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import type { FakeWorkflowEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import { createFakeEditorUseCases } from "~/editor/testing/fakeWorkflowEditorUseCases.js";
import type { FakeWorkflowEditorUseCases } from "~/editor/testing/fakeWorkflowEditorUseCases.js";
import type { WorkflowEditorAppKind } from "~/editor/model/getStepTypeOptions.js";
import { createFakeAppAdapter } from "~/editor/testing/fakeEditorAppAdapter.js";
import type { FakeEditorAppAdapter } from "~/editor/testing/fakeEditorAppAdapter.js";
import { WorkflowEditorToasts } from "~/editor/toasts/abstractions.js";
import { WorkflowConfigUseCases } from "~/editor/useCases/abstractions.js";
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
    config: FakeWorkflowConfigUseCases;
    toasts: FakeWorkflowEditorToasts;
    reviewUseCases: FakeReviewUseCases;
    app: FakeEditorAppAdapter;
    params: WorkflowEditorInitParams;
}

/*
 * A presenter with fakes for everything it talks to. Defaults: the viewer is an editor; one model
 * row `Article` bound to the workflow `Article review` with one People step on the team `Editors`
 * (Task 5's fakes); all three step types, the AI editor present with one model and one tool; one
 * automation covering every model; the e-mail transport; one team.
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
    const config = createFakeConfigUseCases();
    config.listStepTypes.mockResolvedValue(createStepTypes());
    config.listAutomationDefinitions.mockResolvedValue([createWebhookAutomation()]);
    config.listAiModels.mockResolvedValue([createAiModel()]);
    config.listAiTools.mockResolvedValue([createAiTool()]);
    config.listTeams.mockResolvedValue({
        teams: [createWorkflowTeamSummary()],
        missingIds: []
    });
    const toasts = createFakeEditorToasts();
    const reviewUseCases = createFakeUseCases();
    const app = createFakeAppAdapter(options.appKind ?? "cms");

    const container = new Container();
    container.registerInstance(
        IdentityContext,
        createWorkflowsIdentityContext({ permissions: [permission] })
    );
    container.registerInstance(WorkflowConfigUseCases, config);
    container.registerInstance(WorkflowEditorToasts, toasts);
    WorkflowEditorPresenterFeature.register(container);
    const presenter = container.resolve(WorkflowEditorPresenter);

    const params: WorkflowEditorInitParams = { useCases, reviewUseCases, app };

    return { presenter, container, useCases, config, toasts, reviewUseCases, app, params };
};
