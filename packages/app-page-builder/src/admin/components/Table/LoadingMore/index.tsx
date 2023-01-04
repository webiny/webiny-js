import React from "react";
import { i18n } from "@webiny/app/i18n";
import { Typography } from "@webiny/ui/Typography";

import { Container } from "./styled";

const t = i18n.ns("app-headless-cms/app-page-builder/pages-table/loading-more");

export const LoadingMore = () => {
    return (
        <Container>
            <Typography use={"body2"}>{t`Loading more pages...`}</Typography>
        </Container>
    );
};
