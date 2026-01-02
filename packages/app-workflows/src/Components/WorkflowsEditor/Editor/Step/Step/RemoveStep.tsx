import React from "react";
import { Accordion, Dialog, Icon } from "@webiny/admin-ui";
import { ReactComponent as TrashIcon } from "@webiny/icons/delete.svg";
import { IWorkflowStep } from "~/types.js";
import { useToggler } from "@webiny/app-admin";

export interface IRemoveStepProps {
    onRemove: () => void;
    step: IWorkflowStep;
}

export const RemoveStep = (props: IRemoveStepProps) => {
    const { onRemove, step } = props;
    const { on, toggle, toggleOn } = useToggler();

    return (
        <>
            <Accordion.Item.Action
                onClick={toggleOn}
                icon={<Icon size={"sm"} label={"Remove Step"} icon={<TrashIcon />} />}
            />
            <Dialog
                open={on}
                onOpenChange={toggle}
                title={`Remove workflow step "${step.title}"?`}
                actions={
                    <>
                        <Dialog.CancelAction onClick={close} />
                        <Dialog.ConfirmAction onClick={onRemove} />
                    </>
                }
                showCloseButton={false}
                dismissible={true}
            >
                You will remove the step from the workflow. This action can be undone if you do not
                save the workflow.
            </Dialog>
        </>
    );
};
