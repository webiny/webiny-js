import React, { ReactElement } from "react";

import { i18n } from "@webiny/app/i18n";
import { ListMeta } from "@webiny/app-folders/types";
import { ButtonPrimary } from "@webiny/ui/Button";

import { Container } from "./styled";

const t = i18n.ns("app-headless-cms/app-page-builder/pages-table/load-more-button");

export interface Props {
    meta: ListMeta;
    windowHeight: number;
    tableHeight: number;
    onClick: () => void;
    disabled?: boolean;
}

export const LoadMoreButton = ({
    disabled,
    meta,
    windowHeight,
    tableHeight,
    onClick
}: Props): ReactElement => {
    if (meta.cursor && windowHeight > tableHeight) {
        return (
            <Container>
                <ButtonPrimary
                    onClick={onClick}
                    disabled={disabled}
                    flat={true}
                >{t`Load more pages`}</ButtonPrimary>
            </Container>
        );
    }

    return <></>;
};
