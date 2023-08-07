import React, { ReactElement } from "react";

import { i18n } from "@webiny/app/i18n";
import { ButtonPrimary } from "@webiny/ui/Button";

import { Container } from "./styled";

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
                <ButtonPrimary
                    onClick={onClick}
                    disabled={disabled}
                    flat={true}
                >{t`Load more records`}</ButtonPrimary>
            </Container>
        );
    }

    return null;
};
