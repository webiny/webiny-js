import React, { useState } from "react";
import { useQuery } from '@apollo/react-hooks';
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import { Dialog, DialogTitle, DialogContent } from "@webiny/ui/Dialog";
import { CopyButton } from "@webiny/ui/Button";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { LIST_ENVIRONMENT_ALIASES } from "./views/EnvironmentAliases/graphql";
import { toLower } from "lodash";
import { Typography } from "@webiny/ui/Typography";
import { Tooltip } from "@webiny/ui/Tooltip";

export type NewContentModelDialogProps = {
    open: boolean;
    onClose: () => void;
    name: string;
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
    aliasTitle: css({
        minWidth: "200px"
    }),
    api: css({
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
    name
}) => {
    const { showSnackbar } = useSnackbar();
    const graphqlApiUrl = process.env.REACT_APP_API_URL;
    const [totalAliases, setTotalAliases] = useState([]);

    useQuery(LIST_ENVIRONMENT_ALIASES, {
        onCompleted: data => {
            setTotalAliases(data.cms.environmentAliases.data);
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
                    <div>
                        <div className={style.apiUrl}>
                            <Tooltip className={style.api} content={<span>This link allows you to access content created by different application across Webiny like Page Builder or Form Builder.</span>}>
                                <Typography use={"headline6"} >GraphQL API:</Typography>
                            </Tooltip>
                            <a
                                href={process.env.REACT_APP_GRAPHQL_API_URL}
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                {process.env.REACT_APP_GRAPHQL_API_URL}
                            </a>
                            <CopyButton
                                value={process.env.REACT_APP_GRAPHQL_API_URL}
                                onCopy={() => showSnackbar("Successfully copied!")}
                            />
                        </div>
                        <Typography use={"headline6"} style={{fontSize: "1.4rem"}}>
                            Headless CMS - {name}
                        </Typography>
                        {
                            totalAliases.filter((elem) => elem.environment.name === name).map((elem) => {
                                return(
                                    <div key={elem.id} className={style.aliasContainer}>
                                        <Typography use={"headline6"}>
                                            Alias: {elem.name}
                                        </Typography>
                                        <div className={style.apiUrl}>
                                            <Typography use={"subtitle1"} className={style.aliasTitle}>
                                                Content Delivery API:
                                            </Typography>
                                            <a
                                                href={`${graphqlApiUrl}/cms/read/${toLower(elem.name)}`}
                                                rel="noopener noreferrer"
                                                target="_blank"
                                            >
                                                {`${graphqlApiUrl}/cms/read/${toLower(elem.name)}`}
                                            </a>
                                            <CopyButton
                                                value={`${graphqlApiUrl}/cms/read/${toLower(elem.name)}`}
                                                onCopy={() => showSnackbar("Successfully copied!")}
                                            />
                                        </div>
                                        <div className={style.apiUrl}>
                                            <Typography use={"subtitle1"} className={style.aliasTitle}>
                                                Content Preview API:
                                            </Typography>
                                            <a
                                                href={`${graphqlApiUrl}/cms/preview/${toLower(elem.name)}`}
                                                rel="noopener noreferrer"
                                                target="_blank"
                                            >
                                                {`${graphqlApiUrl}/cms/preview/${toLower(elem.name)}`}
                                            </a>
                                            <CopyButton
                                                value={`${graphqlApiUrl}/cms/preview/${toLower(elem.name)}`}
                                                onCopy={() => showSnackbar("Successfully copied!")}
                                            />
                                        </div>
                                        <div className={style.apiUrl}>
                                            <Typography use={"subtitle1"} className={style.aliasTitle}>
                                                Content Management API:
                                            </Typography>
                                            <a
                                                href={`${graphqlApiUrl}/cms/manage/${toLower(elem.name)}`}
                                                rel="noopener noreferrer"
                                                target="_blank"
                                            >
                                                {`${graphqlApiUrl}/cms/manage/${toLower(elem.name)}`}
                                            </a>
                                            <CopyButton
                                                value={`${graphqlApiUrl}/cms/manage/${toLower(elem.name)}`}
                                                onCopy={() => showSnackbar("Successfully copied!")}
                                            />
                                        </div>
                                        <br></br>
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
};

export default EnvironmentInfoDialog;