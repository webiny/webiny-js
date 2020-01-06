// @flow
import * as React from "react";
import type { PbPageDetailsPluginType } from "@webiny/app-page-builder/types";
import InvalidateSsrCache from "./InvalidateSsrCache";

export default ([
    {
        name: "pb-page-details-header-right-options-menu-item-invalidate-ssr-cache",
        type: "pb-page-details-header-right-options-menu-item",
        render(props) {
            return <InvalidateSsrCache {...props} />;
        }
    }
]: Array<PbPageDetailsPluginType>);
