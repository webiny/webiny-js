import React from "react";
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import { Dialog, DialogTitle, DialogContent } from "@webiny/ui/Dialog";
import { getPlugins } from "@webiny/plugins";
import { ApiInformationDialogPlugin } from "@webiny/app-admin/types";

export type NewContentModelDialogProps = {
    open: boolean;
    onClose: () => void;
};

const t = i18n.ns("app-admin/navigation");

const style = {
    narrowDialog: css({
        ".mdc-dialog__surface": {
            width: 800,
            minWidth: 800
        }
    })
};

const ApiInformationDialog: React.FC<NewContentModelDialogProps> = ({ open, onClose }) => {
    const adminInfoPlugins = getPlugins<ApiInformationDialogPlugin>("admin-api-information-dialog");
    return (
        <Dialog
            open={open}
            onClose={onClose}
            className={style.narrowDialog}
            data-testid="environment-info-modal"
        >
            <DialogTitle>{t`API Information`}</DialogTitle>
            <DialogContent>
                {adminInfoPlugins.map(pl => (
                    <div key={pl.name}>{pl.render()}</div>
                ))}
            </DialogContent>
        </Dialog>
    );
};

export default ApiInformationDialog;
