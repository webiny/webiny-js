import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { PageEditor } from "./pages/PageEditor.js";
import { PageList } from "~/pages/PageList.js";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { PagesDashboard } from "./pages/PagesDashboard.js";
import { PAGE_EDITOR_ROUTE, PAGE_LIST_ROUTE } from "~/constants.js";

export const Extension = () => {
    return (
        <AdminConfig>
            <AdminConfig.Route name="wb.pages.list" path={PAGE_LIST_ROUTE} element={<PageList />} />
            <AdminConfig.Route
                name="wb.pages.editor"
                path={PAGE_EDITOR_ROUTE}
                element={<PageEditor />}
            />
            <AdminConfig.Route
                name="wb.pages.dashboard"
                path="/website-builder/pages/dashboard"
                element={
                    <AdminLayout>
                        <PagesDashboard />
                    </AdminLayout>
                }
            />
        </AdminConfig>
    );
};
