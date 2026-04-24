import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { CreatePageDialog, CREATE_PAGE_DIALOG } from "./CreatePageDialog.js";

export const CreatePageConfig = () => {
    return (
        <AdminConfig>
            <AdminConfig.Dialog name={CREATE_PAGE_DIALOG} element={<CreatePageDialog />} />
        </AdminConfig>
    );
};
