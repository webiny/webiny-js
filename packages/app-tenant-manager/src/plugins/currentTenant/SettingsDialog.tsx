import React from "react";
import { css } from "emotion";
import { Form } from "@webiny/form";
import {
    Dialog,
    DialogButton,
    DialogActions,
    DialogCancel,
    DialogContent,
    DialogTitle
} from "@webiny/ui/Dialog";
import { useTenant } from "./useTenant";
import { CircularProgress } from "@webiny/ui/Progress";
import { Domains } from "~/views/tenants/components/Domains";

interface Props {
    open: boolean;
    onClose: () => void;
}

const narrowDialog = css({
    ".mdc-dialog__surface": {
        width: 600,
        minWidth: 600
    }
});

export const SettingsDialog = ({ open, onClose }: Props) => {
    const { tenant, loading, saving, update } = useTenant({ onSaved: onClose });

    return (
        <Dialog open={open} onClose={onClose} className={narrowDialog}>
            <Form onSubmit={update} data={tenant}>
                {({ submit, Bind }) => (
                    <React.Fragment>
                        {loading && <CircularProgress label={"Loading Settings..."} />}
                        {saving && <CircularProgress label={"Saving Settings..."} />}
                        <DialogTitle>Tenant Settings</DialogTitle>
                        <DialogContent>
                            <Bind name={"settings.domains"} defaultValue={[]}>
                                <Domains
                                    Bind={Bind}
                                    title={"Custom Domains"}
                                    inputLabel={"FQDN"}
                                    addButtonLabel={"+ Add FQDN"}
                                />
                            </Bind>
                        </DialogContent>
                        <DialogActions>
                            <DialogCancel>Cancel</DialogCancel>
                            <DialogButton onClick={submit}>Save</DialogButton>
                        </DialogActions>
                    </React.Fragment>
                )}
            </Form>
        </Dialog>
    );
};
