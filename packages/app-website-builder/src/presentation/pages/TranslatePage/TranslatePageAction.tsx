import React from "react";
import { ReactComponent as TranslateIcon } from "@webiny/icons/language.svg";
import { useOpenDialog } from "@webiny/app-admin";
import { usePage } from "~/presentation/pages/PageList/hooks/usePage.js";
import { PageListConfig } from "~/presentation/pages/PageList/configs/index.js";
import { TRANSLATE_PAGE_DIALOG } from "./TranslatePageDialog.js";
import { translatePageParams } from "./translatePageSchema.js";

const { OptionsMenuItem } = PageListConfig.Browser.Page.Action;

export const TranslatePageAction = () => {
    const { openDialog } = useOpenDialog(translatePageParams);
    const { page } = usePage();

    return (
        <OptionsMenuItem
            icon={<TranslateIcon />}
            label="Translate"
            onAction={() =>
                openDialog(TRANSLATE_PAGE_DIALOG, {
                    pageId: page.id,
                    folderId: page.location.folderId,
                    currentLanguage: page.properties.language
                })
            }
        />
    );
};
