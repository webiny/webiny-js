import React from "react";
import { css } from "emotion";
import { Form } from "@webiny/form";
import { Dialog, DialogActions, DialogCancel, DialogContent, DialogTitle } from "@webiny/ui/Dialog";
import { useTenant } from "./useTenant";
import { CircularProgress } from "@webiny/ui/Progress";
import { Domains } from "../Domains";
import { ButtonPrimary } from "@webiny/ui/Button";

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
                {({ submit }) => (
                    <React.Fragment>
                        {loading && <CircularProgress label={"Loading Settings..."} />}
                        {saving && <CircularProgress label={"Saving Settings..."} />}
                        <DialogTitle>Tenant Settings</DialogTitle>
                        <DialogContent>
                            <Domains />
                        </DialogContent>
                        <DialogActions>
                            <DialogCancel>Cancel</DialogCancel>
                            <ButtonPrimary onClick={submit}>Save</ButtonPrimary>
                        </DialogActions>
                    </React.Fragment>
                )}
            </Form>
        </Dialog>
    );
};
