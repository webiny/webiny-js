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

type SelectProps = {
    label: string;
    value: string;
    updateValue: (value: any) => void;
    options?: Array<string>;
    // One or more <option> or <optgroup> elements.
    children?: Array<React.ReactElement<"option"> | React.ReactElement<"optgroup">>;
};

const Select = ({ label, value, updateValue, options, children }: SelectProps) => {
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
};

export default connect<any, any, any>((state, { value, valueKey, defaultValue }: any) => {
    return {
        value: valueKey ? get(getActiveElement(state), valueKey, defaultValue) : value
    };
})(React.memo(Select));
