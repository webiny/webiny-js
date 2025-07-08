import React from "react";
import { CompositionScope } from "@webiny/app-admin";
import { AcoWithConfig } from "@webiny/app-aco";
import { DocumentList } from "~/DocumentList/DocumentList.js";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout.js";
import { FoldersProvider } from "@webiny/app-aco/contexts/folders.js";
import { NavigateFolderProvider } from "~/features/pages/index.js";
import { WB_PAGE_APP } from "~/constants.js";

export const PageList = () => {
    return (
        <CompositionScope name={"websiteBuilder"}>
            <AdminLayout title={"Pages - Website Builder"}>
                <AcoWithConfig>
                    <FoldersProvider type={WB_PAGE_APP}>
                        <NavigateFolderProvider>
                            <DocumentList />
                        </NavigateFolderProvider>
                    </FoldersProvider>
                </AcoWithConfig>
            </AdminLayout>
        </CompositionScope>
    );
};
