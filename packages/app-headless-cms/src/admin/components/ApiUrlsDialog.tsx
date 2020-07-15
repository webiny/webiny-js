import React from "react";
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import { Dialog, DialogTitle, DialogContent } from "@webiny/ui/Dialog";
import HeadlessCmsApiUrls from "@webiny/app-headless-cms/admin/plugins/apiInformationDialog/HeadlessCmsApiUrls";

export type ApiUrlsDialogProps = {
    open: boolean;
    onClose: () => void;
    name?: string;
    type?: string;
};

const t = i18n.ns("app-headless-cms/admin/components/environment-selector-dialog");

const style = {
    narrowDialog: css({
        ".mdc-dialog__surface": {
            width: 800,
            minWidth: 800
        }
    })
};

const ApiUrlsDialog: React.FC<ApiUrlsDialogProps> = ({ open, onClose, name, type }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            className={style.narrowDialog}
            data-testid="environment-selector-modal"
        >
            <DialogTitle>{t`Environment: {name}`({ name: name })}</DialogTitle>
            <DialogContent>
                <HeadlessCmsApiUrls name={name} type={type} />
            </DialogContent>
        </Dialog>
    );
};

export default ApiUrlsDialog;
