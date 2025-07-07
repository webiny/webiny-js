import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { PageEditor } from "./pages/PageEditor.js";
import { PageList } from "~/pages/PageList.js";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { PagesDashboard } from "./pages/PagesDashboard.js";

export const Extension = () => {
    return (
        <AdminConfig>
            <AdminConfig.Route name="wb.pages.list" path="/website-builder/pages" element={<PageList />} />
            <AdminConfig.Route
                name="wb.pages.editor"
                path="/website-builder/pages/editor"
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
