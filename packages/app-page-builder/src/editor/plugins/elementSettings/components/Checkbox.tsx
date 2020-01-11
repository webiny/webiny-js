import * as React from "react";
import { connect } from "react-redux";
import { get } from "lodash";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Checkbox as CheckboxCmp } from "@webiny/ui/Checkbox";
import { getActiveElement } from "@webiny/app-page-builder/editor/selectors";
import { ReactElement } from "react";

type CheckboxProps = {
    label: string;
    value: string;
    updateValue: (value: any) => void;
    // One or more <option> or <optgroup> elements.
    children?: Array<ReactElement<"option"> | ReactElement<"optgroup">>;
};

const Checkbox = ({ label, value, updateValue, children }: CheckboxProps) => {
    return (
        <Grid>
            <Cell span={4}>
                <Typography use={"overline"}>{label}</Typography>
            </Cell>
            <Cell span={8}>
                <CheckboxCmp value={value} onChange={updateValue}>
                    {children}
                </CheckboxCmp>
            </Cell>
        </Grid>
    );
};

export default connect<any, any, any>((state, { value, valueKey, defaultValue }: any) => {
    return {
        value: valueKey ? get(getActiveElement(state), valueKey, defaultValue) : value
    };
})(React.memo(Checkbox));
