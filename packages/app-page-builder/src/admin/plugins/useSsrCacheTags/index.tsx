import * as React from "react";
import InvalidateSsrCache from "./InvalidateSsrCache";
import { PbPageDetailsHeaderRightOptionsMenuItemPlugin } from "@webiny/app-page-builder/admin/types";

export default [
    {
        name: "pb-page-details-header-right-options-menu-item-invalidate-ssr-cache",
        type: "pb-page-details-header-right-options-menu-item",
        render(props) {
            return <InvalidateSsrCache {...props} />;
        }
    }
] as PbPageDetailsHeaderRightOptionsMenuItemPlugin[];
