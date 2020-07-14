import React from "react";
import Hamburger from "./Hamburger";
import gqlApiInformation from "./gqlApiInformation";
import { AdminHeaderLeftPlugin, ApiInformationDialogPlugin } from "@webiny/app-admin/types";

const plugin = [
    {
        name: "admin-header-main-menu-icon",
        type: "admin-header-left",
        render() {
            return <Hamburger />;
        }
    } as AdminHeaderLeftPlugin,
    gqlApiInformation as ApiInformationDialogPlugin
];

export default plugin;
