import React from "react";
import { EmptyState } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";

const t = i18n.ns("app-workflows/components/workflow-states-widget/empty");

export const WorkflowStateListEmpty = () => {
    return (
        <EmptyState
            size={"sm"}
            type={"table"}
            title={t`Nothing to show`}
            description={t`There are no entries available.`}
        />
    );
};
