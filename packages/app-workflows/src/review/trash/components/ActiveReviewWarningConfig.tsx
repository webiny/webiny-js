import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { ACTIVE_REVIEW_WARNING_DIALOG } from "../constants.js";
import { ActiveReviewWarningDialog } from "./ActiveReviewWarningDialog.js";

export const ActiveReviewWarningConfig = () => {
    return (
        <AdminConfig>
            <AdminConfig.Dialog
                name={ACTIVE_REVIEW_WARNING_DIALOG}
                element={<ActiveReviewWarningDialog />}
            />
        </AdminConfig>
    );
};
