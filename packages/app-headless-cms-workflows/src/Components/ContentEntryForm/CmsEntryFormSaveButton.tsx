import React from "react";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";
import { useWorkflowState } from "@webiny/app-workflows";
import { observer } from "mobx-react-lite";

const { Actions } = ContentEntryEditorConfig;
const { ButtonAction } = Actions;

interface IOverrideSaveButtonProps {
    name: string;
    children: React.ReactElement;
}

const OverrideSaveButton = observer((props: IOverrideSaveButtonProps) => {
    const { presenter } = useWorkflowState();

    /**
     * If there is no workflow state or state is approved, we simply render the original element.
     * This is to ensure that no button will be shown if workflow state is active.
     */
    if (props.name !== "save") {
        return props.children;
    } else if (!presenter.vm.state) {
        return props.children;
    }
    return null;
});

export const CmsEntryFormSaveButton = ButtonAction.createDecorator(Original => {
    return function WorkflowCmsEntryFormSaveButton(props) {
        return (
            <Original
                {...props}
                element={<OverrideSaveButton name={props.name}>{props.element}</OverrideSaveButton>}
            />
        );
    };
});
