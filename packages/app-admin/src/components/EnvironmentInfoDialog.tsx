import React from "react";
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import { Dialog, DialogTitle, DialogContent } from "@webiny/ui/Dialog";
import { getPlugins } from "@webiny/plugins";
import { ApiInformationDialog } from "@webiny/app-admin/types";

export type NewContentModelDialogProps = {
    open: boolean;
    onClose: () => void;
    name: string;
    aliases: boolean;
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

const EnvironmentInfoDialog: React.FC<NewContentModelDialogProps> = ({
    open,
    onClose,
    name,
    aliases
}) => {
    const adminInfoPlugins = getPlugins<ApiInformationDialog>(
        "admin-api-information-dialog"
    );
    return (
        <Dialog
            open={open}
            onClose={onClose}
            className={style.narrowDialog}
            data-testid="environment-info-modal"
        >
            <DialogTitle>{t`Environment: `}{name}</DialogTitle>
            <DialogContent>
                {
                    adminInfoPlugins.map(pl => {
                        return (
                            <div key={pl.name}>
                                {pl.render({ name, aliases })}
                            </div>
                        )
                    })
                }
            </DialogContent>
        </Dialog>
    )
};

export default EnvironmentInfoDialog;