/**
 * Verify that this is used somewhere.
 * // TODO @ts-refactor
 */
import React from "react";
import { Elevation } from "@webiny/ui/Elevation";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";

interface PermissionRendererWrapperProps {
    label: string;
    children: React.ReactNode;
}
export const PermissionRendererWrapper = ({ label, children }: PermissionRendererWrapperProps) => (
    <Elevation z={1} className={""}>
        <Grid className={""} style={{ marginTop: 36 }}>
            <Cell span={12}>
                <Typography use={"overline"}>{label}</Typography>
            </Cell>
            <Cell span={12}>
                <Grid style={{ padding: 0, paddingBottom: 24 }}>{children}</Grid>
            </Cell>
        </Grid>
    </Elevation>
);
