import React from "react";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";
import { useWorkflowState } from "@webiny/app-workflows";

const { Actions } = ContentEntryEditorConfig;
const { ButtonAction } = Actions;

interface IOverrideProps {
    name: string;
    children: React.ReactElement;
}

const Override = (props: IOverrideProps) => {
    const { presenter } = useWorkflowState();
    if (!presenter.vm.state) {
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
