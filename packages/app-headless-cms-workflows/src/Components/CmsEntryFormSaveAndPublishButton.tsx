import React, { useMemo } from "react";
import { ContentEntryEditorConfig, useContentEntry } from "@webiny/app-headless-cms";
import { useWorkflowState } from "@webiny/app-workflows";
import { WorkflowStateValue } from "@webiny/app-workflows/types.js";

const { Actions } = ContentEntryEditorConfig;
const { ButtonAction } = Actions;

interface IOverrideSaveAndPublishButtonProps {
    name: string;
    children: React.ReactElement;
}

const OverrideSaveAndPublishButton = (props: IOverrideSaveAndPublishButtonProps) => {
    const { presenter } = useWorkflowState();
    const { entry } = useContentEntry();
    /**
     * If there is no workflow state or state is approved, we simply render the original element.
     * This is to ensure that no button will be shown if workflow state is active.
     */
    const showChildren = useMemo(() => {
        if (presenter.vm.state?.state === WorkflowStateValue.approved) {
            return true;
        } else if (!entry.id) {
            return false;
        } else if (presenter.vm.workflow) {
            return false;
        }
        return true;
    }, [presenter.vm.workflow, entry.id, presenter.vm.state]);

    if (showChildren) {
        return props.children;
    } else if (props.name === "publish") {
        return null;
    }

    return props.children;
};

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
