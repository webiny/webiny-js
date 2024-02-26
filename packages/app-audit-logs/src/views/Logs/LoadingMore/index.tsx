import React from "react";

import { i18n } from "@webiny/app/i18n";
import { Typography } from "@webiny/ui/Typography";
import { CircularProgress } from "@webiny/ui/Progress";

import { Container, LoaderContainer } from "./styled";

const t = i18n.ns("app-audit-logs/components/table/loading-more");

export const LoadingMore = () => {
    return (
        <Container>
            <LoaderContainer>
                <CircularProgress size={20} spinnerWidth={2} />
            </LoaderContainer>
            <Typography use={"body2"}>{t`Loading more records...`}</Typography>
        </Container>
    );
};
