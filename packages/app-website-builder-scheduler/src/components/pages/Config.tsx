import React from "react";
import { PageListConfig } from "@webiny/app-website-builder/exports/admin/website-builder/page/list.js";
import { PageMenuItem } from "./MenuItem.js";

const { Browser } = PageListConfig;

export const PagesConfig = () => {
    return (
        <PageListConfig>
            <Browser.Page.Action name={"page-schedule"} element={<PageMenuItem />} />
        </PageListConfig>
    );
};
