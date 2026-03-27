import React from "react";
import { Form, FormOnSubmit } from "webiny/admin/form";
import { Dialog } from "webiny/admin/ui";
import { ScrollArea } from "webiny/admin/ui";
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
                            style={{ width: 875 }}
                            size={"lg"}
                            open={open}
                            onClose={onClose}
                            title={"Conditional Rules"}
                            description={
                                "Control field visibility and behaviour based on conditions"
                            }
                            actions={
                                <>
                                    <Dialog.CancelAction onClick={onClose} text={"Cancel"} />
                                    <Dialog.ConfirmAction onClick={submit} text={"Save"} />
                                </>
                            }
                        >
                            <ScrollArea className="max-h-[70vh] flex flex-col">
                                <ConditionRulesForm />
                            </ScrollArea>
                        </Dialog>
                    )}
                </Form>
            )}
        </>
    );
};
