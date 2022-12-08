import React from "react";
import styled from "@emotion/styled";
import { i18n } from "@webiny/app/i18n";
import { Typography } from "@webiny/ui/Typography";

const t = i18n.ns("app-headless-cms/app-page-builder/pages-table/loading-more");

const LoadingMoreContainer = styled("div")`
    position: absolute;
    bottom: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 40px;
    background-color: var(--mdc-theme-background);
`;

export const LoadingMore = () => {
    return (
        <LoadingMoreContainer>
            <Typography use={"body2"}>{t`Loading more pages...`}</Typography>
        </LoadingMoreContainer>
    );
};
