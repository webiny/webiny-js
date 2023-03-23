import React from "react";
import { Cell, Grid } from "@webiny/ui/Grid";
import { leftPanel } from "@webiny/app-admin/components/SplitView/SplitView";
import { restGridStyles } from "../publishingWorkflows/components/Styled";
import { ContentReviewDataList } from "./ContentReviewDataList";

interface LayoutCenterProps {
    children: React.ReactNode;
}
const LayoutCenter: React.VFC<LayoutCenterProps> = ({ children }) => {
    return (
        <Grid className={restGridStyles}>
            <Cell span={3} />
            <Cell span={6} className={leftPanel}>
                {children}
            </Cell>
            <Cell span={3} />
        </Grid>
    );
};

export const ContentReviewDashboard: React.VFC = () => {
    return (
        <LayoutCenter>
            <ContentReviewDataList />
        </LayoutCenter>
    );
};
