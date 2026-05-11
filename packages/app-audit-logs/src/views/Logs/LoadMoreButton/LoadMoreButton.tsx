import type { ReactElement } from "react";
import React from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { Button } from "@webiny/admin-ui";
import { Container } from "./styled.js";

const t = i18n.ns("app-audit-logs/views/logs/load-more-button");

export interface LoadMoreButtonProps {
    windowHeight: number;
    tableHeight: number;
    onClick: () => void;
    disabled?: boolean;
    show: boolean;
}

export const LoadMoreButton = ({
    disabled,
    windowHeight,
    tableHeight,
    show,
    onClick
}: LoadMoreButtonProps): ReactElement | null => {
    if (show && windowHeight > tableHeight) {
        return (
            <Container>
                <Button
                    onClick={onClick}
                    disabled={disabled}
                    variant={"primary"}
                >{t`Load more records`}</Button>
            </Container>
        );
    }

    return null;
};
