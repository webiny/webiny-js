import React from "react";
import { PageEditorConfig } from "@webiny/app-website-builder";
import { useWorkflowState, WorkflowStateValue } from "@webiny/app-workflows";

const { Ui } = PageEditorConfig;

interface IWrappedPublishButtonProps {
    element?: React.ReactElement | null;
}

const WrappedPublishButton = (props: IWrappedPublishButtonProps) => {
    const { presenter } = useWorkflowState();
    /**
     * Publish button should be visible only when there is no workflow available and when workflow state is approved.
     */
    if (!presenter.vm.workflow || presenter.vm.state?.state === WorkflowStateValue.approved) {
        return props.element;
    }

    return null;
};

export const PageFormWorkflowStatePublishButton = Ui.TopBar.Action.createDecorator(Original => {
    return function AutoSaveDecorator(props) {
        if (props.name === "buttonPublish") {
            return (
                <Original {...props} element={<WrappedPublishButton element={props.element} />} />
            );
        }
        return <Original {...props} />;
    };
});
