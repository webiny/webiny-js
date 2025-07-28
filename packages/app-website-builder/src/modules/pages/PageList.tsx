import React from "react";
import { CompositionScope, DialogsProvider } from "@webiny/app-admin";
import { AcoWithConfig } from "@webiny/app-aco";
import { DocumentList } from "./PagesList/DocumentList.js";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout.js";
import { FoldersProvider } from "@webiny/app-aco/contexts/folders.js";
import { WB_PAGE_APP } from "~/constants.js";
import { PageListWithConfig } from "~/configs/index.js";
import { NavigateFolderProvider } from "~/modules/pages/PagesList/NavigateFolderProvider";

export const PageList = () => {
    return (
        <CompositionScope name={"wbPage"}>
            <AdminLayout title={"Pages - Website Builder"}>
                <PageListWithConfig>
                    <AcoWithConfig>
                        <FoldersProvider type={WB_PAGE_APP}>
                            <NavigateFolderProvider>
                                <DialogsProvider>
                                    <DocumentList />
                                </DialogsProvider>
                            </NavigateFolderProvider>
                        </FoldersProvider>
                    </AcoWithConfig>
                </PageListWithConfig>
            </AdminLayout>
        </CompositionScope>
    );
};
