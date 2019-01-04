// @flow
import * as React from "react";
import { pure } from "recompose";
import { Typography } from "webiny-ui/Typography";
import { Grid, Cell } from "webiny-ui/Grid";
import ColorPicker from "webiny-app-cms/editor/components/ColorPicker";

type Props = {
    label: string,
    value: string,
    updatePreview: Function,
    updateValue: Function
};

export default pure(({ label, value, updatePreview, updateValue }: Props) => {
    return (
        <Grid>
            <Cell span={4}>
                <Typography use={"overline"}>{label}</Typography>
            </Cell>
            <Cell span={8}>
                <ColorPicker
                    compact
                    value={value}
                    onChange={updatePreview}
                    onChangeComplete={updateValue}
                />
            </Cell>
        </Grid>
    );
});
