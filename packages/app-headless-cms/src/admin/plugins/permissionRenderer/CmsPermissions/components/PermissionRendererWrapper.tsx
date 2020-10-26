import React from "react";
import { Elevation } from "@webiny/ui/Elevation";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";

export const PermissionRendererWrapper = ({ label, children }) => (
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
