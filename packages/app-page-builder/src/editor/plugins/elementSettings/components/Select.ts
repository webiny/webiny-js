// @flow
import * as React from "react";
import { connect } from "react-redux";
import { get } from "lodash";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select as SelectCmp } from "@webiny/ui/Select";
import { getActiveElement } from "@webiny/app-page-builder/editor/selectors";
import { css } from "emotion";

const selectStyle = css({
    select: {
        height: 35,
        paddingTop: "4px !important"
    }
});

type Props = {
    label: string,
    value: string,
    updateValue: Function,
    options?: Array<string>,
    // One or more <option> or <optgroup> elements.
    children?: React.ChildrenArray<React.Element<"option"> | React.Element<"optgroup">>
};

const Select = React.memo(({ label, value, updateValue, options, children }: Props) => {
    return (
        <Grid>
            <Cell span={4}>
                <Typography use={"overline"}>{label}</Typography>
            </Cell>
            <Cell span={8}>
                <SelectCmp
                    className={selectStyle}
                    value={value}
                    onChange={updateValue}
                    options={options}
                >
                    {children}
                </SelectCmp>
            </Cell>
        </Grid>
    );
});

export default connect((state, { value, valueKey, defaultValue }: Object) => {
    return {
        value: valueKey ? get(getActiveElement(state), valueKey, defaultValue) : value
    };
})(Select);
