import React from "react";
import { css } from "emotion";
import { Elevation } from "@webiny/ui/Elevation";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";

const gridClass = css({ marginTop: 36 });

export const PermissionRendererWrapper = ({ label, children }) => (
    <Elevation z={1}>
        <Grid className={gridClass}>
            <Cell span={12}>
                <Typography use={"overline"}>{label}</Typography>
            </Cell>
            <Cell span={12}>
                <Grid style={{ padding: 0, paddingBottom: 24 }}>{children}</Grid>
            </Cell>
        </Grid>
    </Elevation>
);
