import React from "react";
import { CompositionScope } from "@webiny/app-admin";
import { DocumentList } from "~/DocumentList/DocumentList.js";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout.js";

export const PageList = () => {
    return (
        <CompositionScope name={"websiteBuilder"}>
            <AdminLayout>
                <DocumentList />
            </AdminLayout>
        </CompositionScope>
    );
};
