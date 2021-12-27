import React from "react";
import { Cell, Grid } from "@webiny/ui/Grid";
import { leftPanel } from "@webiny/app-admin/components/SplitView/SplitView";
import { restGridStyles } from "../publishingWorkflows/components/Styled";
import ContentReviewDataList from "./ContentReviewDataList";

export function ContentReviewDashboard() {
    return (
        <Grid className={restGridStyles}>
            <Cell span={3} />
            <Cell span={6} className={leftPanel}>
                <ContentReviewDataList />
            </Cell>
            <Cell span={3} />
        </Grid>
    );
}
