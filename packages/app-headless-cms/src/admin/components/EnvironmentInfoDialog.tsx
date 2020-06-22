import React from "react";
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import { Dialog, DialogTitle, DialogContent } from "@webiny/ui/Dialog";
import { CopyButton } from "@webiny/ui/Button";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";

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
            width: 600,
            minWidth: 600
        }
    }),
    apiUrl: css({
        display: "flex",
        alignItems: "center",
    }),
};

const EnvironmentInfoDialog: React.FC<NewContentModelDialogProps> = ({
    open,
    onClose,
    name,
    url
}) => {
    const { showSnackbar } = useSnackbar();
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
                    {
                        url ? <div>
                                <p>GraphQL API:</p>
                                <div className={style.apiUrl}>
                                    <p>{process.env.REACT_APP_GRAPHQL_API_URL}</p>
                                    <CopyButton
                                        value={process.env.REACT_APP_GRAPHQL_API_URL}
                                        onCopy={() =>
                                            showSnackbar("Successfully copied!")
                                        }
                                    />                                    
                                </div>
                                <p>Content Delivery API:</p>
                                <div className={style.apiUrl}>
                                    <p>{`${graphqlApiUrl}${url.read}`}</p>
                                    <CopyButton
                                        value={`${graphqlApiUrl}${url.read}`}
                                        onCopy={() =>
                                            showSnackbar("Successfully copied!")
                                        }
                                    />                                    
                                </div>
                                <p>Content Preview API:</p>
                                <div className={style.apiUrl}>
                                    <p>{`${graphqlApiUrl}${url.preview}`}</p>
                                    <CopyButton
                                        value={`${graphqlApiUrl}${url.preview}`}
                                        onCopy={() =>
                                            showSnackbar("Successfully copied!")
                                        }
                                    />                                    
                                </div>
                                <p>Content Management API:</p>
                                <div className={style.apiUrl}>
                                    <p>{`${graphqlApiUrl}${url.manage}`}</p>
                                    <CopyButton
                                        value={`${graphqlApiUrl}${url.manage}`}
                                        onCopy={() =>
                                            showSnackbar("Successfully copied!")
                                        }
                                    />                                    
                                </div>
                            </div>
                        :   <div>
                            {t`Loading your URL's shortly...`}
                        </div>
                    }
                </div>
            </DialogContent>
        </Dialog>
    )
};

export default EnvironmentInfoDialog;