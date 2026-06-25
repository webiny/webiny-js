import React from "react";
import { PageEditorConfig } from "@webiny/app-website-builder";
import { useWorkflowState } from "@webiny/app-workflows";
import { observer } from "mobx-react-lite";

const { Ui } = PageEditorConfig;

interface IWrappedPublishButtonProps {
    element?: React.ReactElement | null;
}

const WrappedPublishButton = observer((props: IWrappedPublishButtonProps) => {
    const { presenter } = useWorkflowState();
    /**
     * Publish button should be visible only when there is no workflow available and when workflow state is approved.
     */
    if (!presenter.vm.hasWorkflow || presenter.vm.isApproved) {
        return props.element;
    }

    return null;
});

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
