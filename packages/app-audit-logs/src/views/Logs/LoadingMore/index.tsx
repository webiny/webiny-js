import React from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { Typography } from "@webiny/ui/Typography/index.js";
import { CircularProgress } from "@webiny/ui/Progress/index.js";
import { Container, LoaderContainer } from "./styled.js";

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
