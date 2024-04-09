import React from "react";
import { i18n } from "@webiny/app/i18n";
import { Typography } from "@webiny/ui/Typography";
import { CircularProgress } from "@webiny/ui/Progress";
import { Container, LoaderContainer } from "./styled";

const t = i18n.ns("app-headless-cms/admin/components/content-entries/loading-more");

interface LoadingMoreProps {
    show: boolean;
}

export const LoadingMore = ({ show }: LoadingMoreProps) => {
    if (!show) {
        return null;
    }

    return (
        <Container>
            <LoaderContainer>
                <CircularProgress size={20} />
            </LoaderContainer>
            <Typography use={"body2"}>{t`Loading more entries...`}</Typography>
        </Container>
    );
};
