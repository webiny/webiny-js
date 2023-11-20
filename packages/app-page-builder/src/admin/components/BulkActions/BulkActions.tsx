import React, { useMemo } from "react";
import { ReactComponent as Close } from "@material-design-icons/svg/outlined/close.svg";
import { Buttons } from "@webiny/app-admin";
import { IconButton } from "@webiny/ui/Button";

import { usePageListConfig } from "~/admin/config/pages";
import { usePagesList } from "~/admin/views/Pages/hooks/usePagesList";

import { BulkActionsContainer, BulkActionsInner, ButtonsContainer } from "./BulkActions.styled";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-page-builder/admin/components/bulk-actions");

export const getPagesLabel = (count = 0): string => {
    return `${count} ${count === 1 ? "page" : "pages"}`;
};

export const BulkActions = () => {
    const { browser } = usePageListConfig();
    const { selected, setSelected } = usePagesList();

    const headline = useMemo((): string => {
        return t`{label} selected:`({
            label: getPagesLabel(selected.length)
        });
    }, [selected]);

    if (!selected.length) {
        return null;
    }

    return (
        <BulkActionsContainer>
            <BulkActionsInner>
                <ButtonsContainer>
                    <Typography use={"headline6"}>{headline}</Typography>
                    <Buttons actions={browser.bulkActions} />
                </ButtonsContainer>
                <IconButton icon={<Close />} onClick={() => setSelected([])} />
            </BulkActionsInner>
        </BulkActionsContainer>
    );
};
