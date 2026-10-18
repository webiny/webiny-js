import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
import { EditorDetailLoading } from "./EditorDetailLoading.js";
import { EditorHeader } from "./EditorHeader.js";
import { EditorLoadError } from "./EditorLoadError.js";
import { EditorLoading } from "./EditorLoading.js";
import { EditorNoPermission } from "./EditorNoPermission.js";
import { ModelPanel } from "./ModelPanel.js";
import { NoWorkflowState } from "./NoWorkflowState.js";
import { StepTypePicker } from "./StepTypePicker.js";
import { WorkflowFlow } from "./WorkflowFlow.js";
import type { WorkflowEditorViewPresenter } from "./WorkflowEditorViewPresenter.js";

export interface WorkflowEditorLayoutProps {
    presenter: WorkflowEditorViewPresenter;
    app: Pick<WorkflowEditorAppAdapter, "renderModelIcon">;
    // The step drawer, mounted once beside the editor (`WorkflowEditorView` passes `<StepDrawer source={presenter} stepId={vm.openStepId} />`, R284: the drawer opens and closes its own presenter from `stepId` and calls `source.closeStep()` when it closes itself).
    drawer: React.ReactNode;
}

/*
 * The presentational editor: the page states, the model panel and the open workflow's header. It
 * reads the presenter's render-ready view model and calls its commands (R234).
 */
export const WorkflowEditorLayout = createReactiveComponent(function WorkflowEditorLayout(
    props: WorkflowEditorLayoutProps
) {
    const { presenter, app, drawer } = props;
    const vm = presenter.vm;

    if (vm.status === "loading") {
        return <EditorLoading />;
    }
    if (vm.status === "failed") {
        return <EditorLoadError description={vm.error ?? ""} onRetry={() => presenter.retry()} />;
    }
    if (vm.status === "noAccess") {
        return <EditorNoPermission />;
    }

    const header = vm.header;
    let content: React.ReactNode = null;
    if (vm.detail === "loading") {
        content = <EditorDetailLoading />;
    } else if (vm.detail === "workflow" && header !== null) {
        content = (
            <div className="flex flex-col min-h-0 grow">
                <EditorHeader
                    header={header}
                    onNameChange={name => presenter.setName(name)}
                    onSave={() => presenter.save()}
                    onDelete={() => presenter.requestDelete()}
                />
                <div className="grow overflow-y-auto p-lg">
                    <WorkflowFlow
                        flow={vm.flow}
                        scrollRequest={vm.scrollRequest}
                        disabled={header.saving}
                        onAddStep={index => presenter.openTypePicker(index)}
                        onEditStep={stepId => presenter.openStep(stepId)}
                        onMoveStep={(from, to) => presenter.moveStep(from, to)}
                        onDeleteStep={stepId => presenter.requestDeleteStep(stepId)}
                    />
                </div>
            </div>
        );
    } else if (vm.detail === "empty" && vm.empty !== null) {
        content = (
            <NoWorkflowState
                title={vm.empty.title}
                description={vm.empty.description}
                onCreate={() => presenter.createWorkflow()}
            />
        );
    }

    let picker: React.ReactNode = null;
    if (vm.typePicker !== null) {
        const index = vm.typePicker.index;
        const saving = header !== null && header.saving;
        picker = (
            <StepTypePicker
                options={vm.typePicker.options}
                onPick={type => {
                    // Edits do nothing while a save is in flight (Task 10).
                    if (!saving) {
                        presenter.addStep(index, type);
                    }
                }}
                onClose={() => presenter.closeTypePicker()}
            />
        );
    }

    return (
        <div data-testid="workflow-editor" className="grid grid-cols-[272px_1fr] h-main-content">
            <ModelPanel
                panel={vm.panel}
                renderIcon={modelId => app.renderModelIcon(modelId)}
                onSearch={search => presenter.setSearch(search)}
                onSelect={modelId => presenter.selectModel(modelId)}
                onLoadMore={() => presenter.loadMore()}
                onRetry={() => presenter.retryModels()}
            />
            <div className="flex flex-col min-w-0 overflow-hidden">{content}</div>
            {drawer}
            {picker}
        </div>
    );
});
