import React from "react";
import { Form, FormOnSubmit } from "webiny/admin/form";
import { Dialog } from "@webiny/admin-ui";
import { FunnelModelDto } from "../../models/FunnelModel";
import { ConditionRulesForm } from "./ConditionRulesDialog/ConditionRulesForm";

interface ConditionRulesDialogProps {
    open: boolean;
    data: FunnelModelDto;
    onClose: () => void;
    onSubmit: FormOnSubmit<FunnelModelDto>;
}

export const ConditionRulesDialog = ({
    data,
    open,
    onClose,
    onSubmit
}: ConditionRulesDialogProps) => {
    return (
        <>
            {data && (
                <Form<FunnelModelDto> data={data} onSubmit={onSubmit}>
                    {({ submit }) => (
                        <Dialog
                            open={open}
                            onClose={onClose}
                            title={"Conditional Rules"}
                            actions={
                                <>
                                    <Dialog.CancelAction onClick={onClose} text={"Cancel"} />
                                    <Dialog.ConfirmAction onClick={submit} text={"Save"} />
                                </>
                            }
                        >
                            <div className={"w-[875px] min-h-[600px] max-h-[800px] overflow-auto"}>
                                <ConditionRulesForm />
                            </div>
                        </Dialog>
                    )}
                </Form>
            )}
        </>
    );
};
