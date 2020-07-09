import React from "react";
import { css } from "emotion";
import { CopyButton } from "@webiny/ui/Button";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Typography } from "@webiny/ui/Typography";
import { Tooltip } from "@webiny/ui/Tooltip";

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

const ReactGraphqlUrl = () => {
    const { showSnackbar } = useSnackbar();

    return ([
        <div className={style.apiUrl} key="graphql-api-container">
            <Tooltip className={style.api} content={<span>This link allows you to access content created by different application across Webiny like Page Builder or Form Builder.</span>}>
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
            
        </div>,
        <br key="graphql-break"></br>
    ])
};

export default ReactGraphqlUrl;