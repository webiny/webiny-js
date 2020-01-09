import * as React from "react";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Switch } from "@webiny/ui/Switch";
import { Footer as FooterStyled } from "@webiny/app-page-builder/editor/plugins/elementSettings/components/StyledComponents";
import { css } from "emotion";

const switchStyle = css({
    "&.webiny-ui-switch": {
        marginRight: "0"
    }
});

const Footer = ({ advanced, toggleAdvanced }) => (
    <FooterStyled>
        <Grid className={"no-bottom-padding"}>
            <Cell span={8}>
                <Typography use={"subtitle2"}>Show advanced options</Typography>
            </Cell>
            <Cell span={4}>
                <Switch className={switchStyle} value={advanced} onChange={toggleAdvanced} />
            </Cell>
        </Grid>
    </FooterStyled>
);

export default React.memo(Footer);
