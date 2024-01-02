import * as React from "react";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Switch } from "@webiny/ui/Switch";
import { Footer as FooterStyled } from "./StyledComponents";
import { css } from "emotion";

const switchStyle = css({
    "&.webiny-ui-switch": {
        marginRight: "0"
    }
});

interface FooterProps {
    advanced: boolean;
    toggleAdvanced: (value: any) => void;
}
const Footer = ({ advanced, toggleAdvanced }: FooterProps) => (
    <FooterStyled>
        <Grid className={"no-bottom-padding"}>
            <Cell span={8}>
                <Typography use={"body2"}>Show advanced options</Typography>
            </Cell>
            <Cell span={4}>
                <Switch className={switchStyle} value={advanced} onChange={toggleAdvanced} />
            </Cell>
        </Grid>
    </FooterStyled>
);

export default React.memo(Footer);
