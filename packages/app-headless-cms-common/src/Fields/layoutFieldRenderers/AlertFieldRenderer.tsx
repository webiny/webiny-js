import React from "react";
import { Alert, Grid } from "@webiny/admin-ui";
import type { CmsAlertLayoutDescriptor } from "~/types/model.js";

interface AlertFieldRendererProps {
    descriptor: CmsAlertLayoutDescriptor;
}

export const AlertFieldRenderer = ({ descriptor }: AlertFieldRendererProps) => {
    return (
        <Grid.Column span={12}>
            <Alert type={descriptor.alertType}>{descriptor.label}</Alert>
        </Grid.Column>
    );
};
