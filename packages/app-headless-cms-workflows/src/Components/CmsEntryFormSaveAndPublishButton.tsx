import React from "react";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";
import { useWorkflowState } from "@webiny/app-workflows";
import { WorkflowStateValue } from "@webiny/app-workflows/types.js";

const { Actions } = ContentEntryEditorConfig;
const { ButtonAction } = Actions;

interface IOverrideProps {
    name: string;
    children: React.ReactElement;
}

const Override = (props: IOverrideProps) => {
    const { presenter } = useWorkflowState();
    /**
     * If there is no workflow state or state is approved, we simply render the original element.
     * This is to ensure that no button will be shown if workflow state is active.
     */
    if (!presenter.vm.state || presenter.vm.state.state === WorkflowStateValue.approved) {
        return props.children;
    } else if (props.name === "publish" || props.name === "save") {
        return null;
    }
    return props.children;
};

export const CmsEntryFormSaveAndPublishButton = ButtonAction.createDecorator(Original => {
    return function WorkflowCmsEntryFormSaveAndPublishButton(props) {
        return (
            <Original {...props} element={<Override name={props.name}>{props.element}</Override>} />
        );
    };
});
