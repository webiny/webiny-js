import React from "react";
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import { Dialog, DialogTitle, DialogContent } from "@webiny/ui/Dialog";
import { ButtonDefault, ButtonIcon } from "@webiny/ui/Button";
import { ReactComponent as CloseIcon } from "./round-close-24px.svg";

export type NewContentModelDialogProps = {
    open: boolean;
    onClose: () => void;
    name: string;
    url: {
        manage: string;
        preview: string;
        read: string;
    };
};

const t = i18n.ns("app-headless-cms/admin/components/environment-selector-dialog");

const style = {
    narrowDialog: css({
        ".mdc-dialog__surface": {
            width: 400,
            minWidth: 400
        }
    }),
};

const EnvironmentInfoDialog: React.FC<NewContentModelDialogProps> = ({
    open,
    onClose,
    name,
    url
}) => {
    const graphqlApiUrl = process.env.REACT_APP_API_URL;
    return (
        <Dialog
            open={open}
            onClose={onClose}
            className={style.narrowDialog}
            data-testid="environment-info-modal"
        >
            <DialogTitle>{t`Environment: `}{name}</DialogTitle>
            <DialogContent>
                <div>
                    <p>{graphqlApiUrl}</p>
                    {
                        url && <div>
                                <p>GraphQL API: {process.env.REACT_APP_GRAPHQL_API_URL}</p>
                                <p>Content Delivery API: {`${graphqlApiUrl}${url.read}`}</p>
                                <p>Content Preview API: {`${graphqlApiUrl}${url.preview}`}</p>
                                <p>Content Management API: {`${graphqlApiUrl}${url.manage}`}</p>
                            </div>
                    }
                </div>
                <div>
                    <ButtonDefault
                        onClick={() => {
                            onClose
                        }}
                    >
                        <ButtonIcon icon={<CloseIcon />} />
                    </ButtonDefault>
                </div>
            </DialogContent>
        </Dialog>
    )
};

export default EnvironmentInfoDialog;