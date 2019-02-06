// @flow
import * as React from "react";
import { connect } from "react-redux";
import { get } from "lodash";
import { pure } from "recompose";
import { Typography } from "webiny-ui/Typography";
import { Grid, Cell } from "webiny-ui/Grid";
import { CheckboxGroup as CheckboxGroupCmp, Checkbox as CheckboxCmp } from "webiny-ui/Checkbox";
import { getActiveElement } from "webiny-app-cms/editor/selectors";

type Props = {
    label: string,
    value: string,
    updateValue: Function,
    options?: Array<string>,
    // One or more <option> or <optgroup> elements.
    children?: React.ChildrenArray<React.Element<"option"> | React.Element<"optgroup">>
};

const Select = pure(({ label, value, updateValue, options, children }: Props) => {
    return (
        <Grid>
            <Cell span={4}>
                <Typography use={"overline"}>{label}</Typography>
            </Cell>
            <Cell span={8}>
                <CheckboxCmp value={value} onChange={updateValue} options={options}>
                    {children}
                </CheckboxCmp>
            </Cell>
        </Grid>
    );
});

export default connect((state, { value, valueKey, defaultValue }: Object) => {
    return {
        value: valueKey ? get(getActiveElement(state), valueKey, defaultValue) : value
    };
})(Select);
