import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { HasPermission } from "~/presentation/security/HasPermission.js";
import { TranslatePageAction } from "./TranslatePageAction.js";
import { TranslatePageDialog, TRANSLATE_PAGE_DIALOG } from "./TranslatePageDialog.js";
import { PageListConfig } from "~/exports/admin/website-builder/page/list.js";

const { Browser } = PageListConfig;

export const TranslatePageConfig = () => {
    return (
        <>
            <AdminConfig>
                <AdminConfig.Dialog
                    name={TRANSLATE_PAGE_DIALOG}
                    element={<TranslatePageDialog />}
                />
            </AdminConfig>
            <PageListConfig>
                <HasPermission entity="page" action="create">
                    <Browser.Page.Action name="translate" element={<TranslatePageAction />} />
                </HasPermission>
            </PageListConfig>
        </>
    );
};
