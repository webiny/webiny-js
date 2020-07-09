import React from "react";
import { ApiInformationDialogPlugin } from "@webiny/app-admin/types";
import HeadlessCmsApiUrls from "./apiInformationDialog/HeadlessCmsApiUrls";

const plugin: ApiInformationDialogPlugin = {
    type: "admin-api-information-dialog",
    name: "admin-api-information-dialog-headless-cms",
    render() {
        return <HeadlessCmsApiUrls />;
    }
};

export default plugin;
