import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { PageEditor } from "./pages/PageEditor.js";
import { PageList } from "~/pages/PageList.js";

export const Extension = () => {
    return (
        <AdminConfig>
            <AdminConfig.Route name="wb.pages.list" path="/wb/pages" element={<PageList />} />
            <AdminConfig.Route
                name="wb.pages.editor"
                path="/wb/pages/editor"
                element={<PageEditor />}
            />
        </AdminConfig>
    );
};
