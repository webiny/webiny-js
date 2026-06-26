import React from "react";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";
import { useWorkflowState } from "@webiny/app-workflows";

const { Actions } = ContentEntryEditorConfig;
const { MenuItemAction } = Actions;

interface IOverrideScheduleMenuItemActionProps {
    name: string;
    children: React.ReactElement;
}

const OverrideScheduleMenuItemAction = (props: IOverrideScheduleMenuItemActionProps) => {
    const { presenter } = useWorkflowState();
    /**
     * If there is no workflow state or state is approved, we simply render the original element.
     * This is to ensure that no button will be shown if workflow state is active.
     */
    if (!presenter.vm.hasWorkflow || presenter.vm.isApproved) {
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
            <Original
                {...props}
                element={
                    <OverrideScheduleMenuItemAction name={props.name}>
                        {props.element}
                    </OverrideScheduleMenuItemAction>
                }
            />
        );
    };
});
