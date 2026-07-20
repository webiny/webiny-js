import React from "react";
import { EmptyState } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";

const t = i18n.ns("app-workflows/components/workflow-states-widget/empty");

export const WorkflowStateListEmpty = () => {
    return (
        <EmptyState
            size={"sm"}
            type={"table"}
            description={t`There are no entries available.`}
            // Match the loading skeleton's height (3 rows) so the widget doesn't
            // resize when loading finishes and the empty state is shown. `py-0`
            // is deliberate: it lets `min-h` fully control the height so it lines
            // up exactly with the skeleton (adding the variant's padding overshoots).
            className={"min-h-[194px] py-0"}
        />
    );
};
