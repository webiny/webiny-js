import React from "react";
import { ReactComponent as DuplicateIcon } from "@webiny/icons/library_add.svg";
import { useDocument } from "~/modules/pages/PagesList/hooks/useDocument.js";
import { useDuplicatePageConfirmationDialog } from "~/modules/pages/PagesList/hooks/useDuplicatePageConfirmationDialog.js";
import { PageListConfig } from "~/configs/index.js";

export const Duplicate = () => {
    const { document } = useDocument();
    const { openDuplicatePageConfirmationDialog } = useDuplicatePageConfirmationDialog({
        page: document
    });
    const { OptionsMenuItem } = PageListConfig.Browser.Page.Action;

    return (
        <OptionsMenuItem
            icon={<DuplicateIcon />}
            label={"Duplicate"}
            onAction={openDuplicatePageConfirmationDialog}
        />
    );
};
