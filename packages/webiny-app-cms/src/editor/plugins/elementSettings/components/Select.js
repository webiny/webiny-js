// @flow
import * as React from "react";
import { pure } from "recompose";
import { Typography } from "webiny-ui/Typography";
import { Grid, Cell } from "webiny-ui/Grid";
import { Select } from "webiny-ui/Select";

type Props = {
    label: string,
    value: string,
    updateValue: Function,
    options?: Array<string>,
    // One or more <option> or <optgroup> elements.
    children?: React.ChildrenArray<React.Element<"option"> | React.Element<"optgroup">>
};

export default pure(({ label, value, updateValue, options, children }: Props) => {
    return (
        <Grid>
            <Cell span={4}>
                <Typography use={"overline"}>{label}</Typography>
            </Cell>
            <Cell span={8}>
                <Select value={value} onChange={updateValue} options={options}>
                    {children}
                </Select>
            </Cell>
        </Grid>
    );
});
