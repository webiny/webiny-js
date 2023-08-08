import React, { useMemo } from "react";
import { ReactComponent as Close } from "@material-design-icons/svg/outlined/close.svg";
import { Buttons } from "@webiny/app-admin";
import { IconButton } from "@webiny/ui/Button";

import { useContentEntryListConfig } from "~/admin/config/contentEntries";
import { useContentEntriesList } from "~/admin/views/contentEntries/hooks";

import { BulkActionsContainer, BulkActionsInner, ButtonsContainer } from "./styles";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-headless-cms/admin/content-entries/bulk-actions");

export const BulkActions = () => {
    const { browser } = useContentEntryListConfig();
    const { selected } = useContentEntriesList();

    const headline = useMemo((): string => {
        return t`{count|count:1:entry:default:entries} selected:`({
            count: selected.length
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
                <IconButton icon={<Close />} onClick={() => console.log("demo")} />
            </BulkActionsInner>
        </BulkActionsContainer>
    );
};
