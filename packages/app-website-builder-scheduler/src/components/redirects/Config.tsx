import React from "react";
import { RedirectListConfig } from "@webiny/app-website-builder/exports/admin/website-builder/redirect/list.js";
import { RedirectMenuItem } from "./MenuItem.js";

const { Browser } = RedirectListConfig;

export const RedirectsConfig = () => {
    return (
        <RedirectListConfig>
            <Browser.Redirect.Action name={"redirect-schedule"} element={<RedirectMenuItem />} />
        </RedirectListConfig>
    );
};
