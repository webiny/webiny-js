import React from "react";
import { Alert, Grid } from "@webiny/admin-ui";
import type { CmsAlertLayoutField } from "~/types/model.js";

interface AlertFieldRendererProps {
    field: CmsAlertLayoutField;
}

export const AlertFieldRenderer = ({ field }: AlertFieldRendererProps) => {
    return (
        <Grid.Column span={12}>
            <Alert type={field.alertType}>{field.label}</Alert>
        </Grid.Column>
    );
};
