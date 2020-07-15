import React from "react";
import { ApiInformationDialogPlugin } from "@webiny/app-admin/types";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Typography } from "@webiny/ui/Typography";
import { CopyButton } from "@webiny/ui/Button";
import { css } from "emotion";

const style = {
    apiUrl: css({
        display: "flex",
        alignItems: "center"
    }),
    api: css({
        fontWeight: "bold",
        minWidth: "200px"
    })
};

const plugin: ApiInformationDialogPlugin = {
    type: "admin-api-information-dialog",
    name: "admin-api-information-dialog-graphql",
    render() {
        const { showSnackbar } = useSnackbar();

        return (
            <>
                <div className={style.apiUrl}>
                    <Tooltip
                        className={style.api}
                        content={
                            <span>
                                This link allows you to access content created by different
                                application across Webiny like Page Builder or Form Builder.
                            </span>
                        }
                    >
                        <Typography use={"headline6"}>GraphQL API:</Typography>
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
                <br key="graphql-break"/>
            </>
        );
    }
};

export default plugin;
