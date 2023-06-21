import React from "react";
import { i18n } from "@webiny/app/i18n";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Container } from "./styled";

const t = i18n.ns("app-headless-cms/admin/components/content-entries/load-more-button");

interface Props {
    windowHeight: number;
    tableHeight: number;
    onClick: () => void;
    disabled?: boolean;
    show: boolean;
}

export const LoadMoreButton: React.VFC<Props> = ({
    disabled,
    windowHeight,
    tableHeight,
    show,
    onClick
}) => {
    if (!show || windowHeight <= tableHeight) {
        return null;
    }

    return (
        <Container>
            <ButtonPrimary
                onClick={onClick}
                disabled={disabled}
                flat={true}
            >{t`Load more entries`}</ButtonPrimary>
        </Container>
    );
};
