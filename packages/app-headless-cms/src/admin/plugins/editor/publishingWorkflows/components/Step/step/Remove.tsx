import React from "react";
import { Accordion, Dialog } from "@webiny/admin-ui";
import { ReactComponent as TrashIcon } from "@webiny/icons/delete.svg";
import { IWorkflowStep } from "~/types.js";
import { useToggler } from "@webiny/app-admin";

export interface IRemoveProps {
    onRemove: () => void;
    step: IWorkflowStep;
}

export const Remove = (props: IRemoveProps) => {
    const { onRemove, step } = props;
    const { on, toggle, toggleOn } = useToggler();

    return (
        <>
            <Accordion.Item.Action onClick={toggleOn} icon={<TrashIcon />} />
            <Dialog
                open={on}
                onOpenChange={toggle}
                title={`Remove workflow step "${step.title}"?`}
                actions={
                    <>
                        <Dialog.CancelButton onClick={close} />
                        <Dialog.ConfirmButton onClick={onRemove} />
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
