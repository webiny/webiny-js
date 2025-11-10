import React from "react";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";
import { useWorkflowState } from "@webiny/app-workflows";
import { observer } from "mobx-react-lite";

const { Actions } = ContentEntryEditorConfig;
const { ButtonAction } = Actions;

interface IOverrideSaveAndPublishButtonProps {
    name: string;
    children: React.ReactElement;
}

const OverrideSaveAndPublishButton = observer((props: IOverrideSaveAndPublishButtonProps) => {
    const { presenter } = useWorkflowState();

    /**
     * If there is no workflow state or state is approved, we simply render the original element.
     * This is to ensure that no button will be shown if workflow state is active.
     */
    console.log({
        workflow: presenter.vm.workflow
    });
    if (props.name !== "publish" || !presenter.vm.workflow) {
        return props.children;
    }
    return null;
});

export const CmsEntryFormSaveAndPublishButton = ButtonAction.createDecorator(Original => {
    return function WorkflowCmsEntryFormSaveAndPublishButton(props) {
        return (
            <Original
                {...props}
                element={
                    <OverrideSaveAndPublishButton name={props.name}>
                        {props.element}
                    </OverrideSaveAndPublishButton>
                }
            />
        );
    };
});
