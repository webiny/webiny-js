import React from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { Text, Loader } from "@webiny/admin-ui";
import { Container, LoaderContainer } from "./styled.js";

const t = i18n.ns("app-audit-logs/components/table/loading-more");

export const LoadingMore = () => {
    return (
        <Container>
            <LoaderContainer>
                <Loader size={"sm"} />
            </LoaderContainer>
            <Text size={"sm"}>{t`Loading more records...`}</Text>
        </Container>
    );
};
