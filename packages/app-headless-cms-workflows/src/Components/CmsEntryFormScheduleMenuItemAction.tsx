import React from "react";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";
import { useWorkflowState } from "@webiny/app-workflows";

const { Actions } = ContentEntryEditorConfig;
const { MenuItemAction } = Actions;

interface IOverrideProps {
    name: string;
    children: React.ReactElement;
}

const Override = (props: IOverrideProps) => {
    const { presenter } = useWorkflowState();
    if (!presenter.vm.state) {
        return props.children;
    } else if (props.name === "schedule") {
        return null;
    }
    return props.children;
};
/**
 * There is a possibility that this decorator will not do anything, because scheduler is not turned on.
 */
export const CmsEntryFormScheduleMenuItemAction = MenuItemAction.createDecorator(Original => {
    return function WorkflowCmsEntryScheduleMenuItemAction(props) {
        return (
            <Original {...props} element={<Override name={props.name}>{props.element}</Override>} />
        );
    };
});
