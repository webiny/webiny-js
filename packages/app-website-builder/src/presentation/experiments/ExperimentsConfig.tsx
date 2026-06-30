import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { HasPermission } from "~/presentation/security/HasPermission.js";
import { ExperimentsAction } from "./ExperimentsAction.js";
import { ExperimentsDialog, EXPERIMENTS_DIALOG } from "./ExperimentsDialog.js";
import { PageListConfig } from "~/exports/admin/website-builder/page/list.js";

const { Browser } = PageListConfig;

export const ExperimentsConfig = () => {
    return (
        <>
            <AdminConfig>
                <AdminConfig.Dialog name={EXPERIMENTS_DIALOG} element={<ExperimentsDialog />} />
            </AdminConfig>
            <PageListConfig>
                <HasPermission entity="experiment" action="create">
                    <Browser.Page.Action name="experiments" element={<ExperimentsAction />} />
                </HasPermission>
            </PageListConfig>
        </>
    );
};
