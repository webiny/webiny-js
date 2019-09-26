// @flow
import * as React from "react";
import { connect } from "react-redux";
import { get } from "lodash";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import ColorPickerCmp from "@webiny/app-page-builder/editor/components/ColorPicker";
import { getActiveElement } from "@webiny/app-page-builder/editor/selectors";

type Props = {
    label: string,
    value: string,
    updatePreview: Function,
    updateValue: Function
};

const ColorPicker = React.memo(({ label, value, updatePreview, updateValue }: Props) => {
    return (
        <Grid>
            <Cell span={4}>
                <Typography use={"overline"}>{label}</Typography>
            </Cell>
            <Cell span={8}>
                <ColorPickerCmp
                    compact
                    value={value}
                    onChange={updatePreview}
                    onChangeComplete={updateValue}
                />
            </Cell>
        </Grid>
    );
});

export default connect((state, { value, valueKey, defaultValue }: Object) => {
    return {
        value: valueKey ? get(getActiveElement(state), valueKey, defaultValue) : value
    };
})(ColorPicker);
