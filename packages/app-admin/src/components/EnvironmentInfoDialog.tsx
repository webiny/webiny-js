import React, { useState } from "react";
import { useQuery } from '@apollo/react-hooks';
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import { Dialog, DialogTitle, DialogContent } from "@webiny/ui/Dialog";
import { CopyButton } from "@webiny/ui/Button";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { LIST_ENVIRONMENT_ALIASES } from "./views/EnvironmentAliases/graphql";

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

const t = i18n.ns("app-admin/navigation");

const style = {
    narrowDialog: css({
        ".mdc-dialog__surface": {
            width: 800,
            minWidth: 800
        }
    }),
    apiUrl: css({
        display: "flex",
        alignItems: "center"
    }),
    alias: css({
        fontSize: "1.25rem",
        fontWeight: "bold"
    }),
    aliasTitle: css({
        textDecoration: "underline",
        minWidth: "200px"
    }),
    api: css({
        fontSize: "1.25rem",
        fontWeight: "bold",
        minWidth: "200px"
    }),
    aliasContainer: css({
        marginTop: "10px"
    })
};

const EnvironmentInfoDialog: React.FC<NewContentModelDialogProps> = ({
    open,
    onClose,
    name,
    url
}) => {
    const { showSnackbar } = useSnackbar();
    const graphqlApiUrl = process.env.REACT_APP_API_URL;
    const [aliases, setAliases] = useState([]);

    useQuery(LIST_ENVIRONMENT_ALIASES, {
        onCompleted: data => {
            setAliases(data.cms.environmentAliases.data.filter((elem) => elem.environment.name === name));
        }
    });

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
                        url && aliases.length > 0 ?
                            <div>
                                <div className={style.apiUrl}>
                                    <p className={style.api}>GraphQL URL:</p>
                                    <p>{process.env.REACT_APP_GRAPHQL_API_URL}</p>
                                    <CopyButton
                                        value={process.env.REACT_APP_GRAPHQL_API_URL}
                                        onCopy={() => showSnackbar("Successfully copied!")}
                                    />
                                </div>
                                {
                                    aliases.map((elem) => {
                                        return(
                                            <div key={elem.id} className={style.aliasContainer}>
                                                <p className={style.alias}>Alias: {elem.name}</p>
                                                <div className={style.apiUrl}>
                                                    <p className={style.aliasTitle}>Content Delivery API:</p>
                                                    <p>{`${graphqlApiUrl}${elem.url.read}`}</p>
                                                    <CopyButton
                                                        value={`${graphqlApiUrl}${elem.url.read}`}
                                                        onCopy={() => showSnackbar("Successfully copied!")}
                                                    />
                                                </div>
                                                <div className={style.apiUrl}>
                                                    <p className={style.aliasTitle}>Content Preview API:</p>
                                                    <p>{`${graphqlApiUrl}${elem.url.preview}`}</p>
                                                    <CopyButton
                                                        value={`${graphqlApiUrl}${elem.url.preview}`}
                                                        onCopy={() => showSnackbar("Successfully copied!")}
                                                    />
                                                </div>
                                                <div className={style.apiUrl}>
                                                    <p className={style.aliasTitle}>Content Management API:</p>
                                                    <p>{`${graphqlApiUrl}${elem.url.manage}`}</p>
                                                    <CopyButton
                                                        value={`${graphqlApiUrl}${elem.url.manage}`}
                                                        onCopy={() => showSnackbar("Successfully copied!")}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })
                                }
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