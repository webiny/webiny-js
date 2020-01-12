import * as React from "react";
import { connect } from "react-redux";
import { get } from "lodash";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import ColorPickerCmp from "@webiny/app-page-builder/editor/components/ColorPicker";
import { getActiveElement } from "@webiny/app-page-builder/editor/selectors";

type ColorPickerProps = {
    label: string;
    value: string;
    updatePreview: Function;
    updateValue: Function;
};

const ColorPicker = ({ label, value, updatePreview, updateValue }: ColorPickerProps) => {
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
};

type ColorPickerConnectProps = {
    value?: string;
    valueKey?: string;
    defaultValue?: string;
};

export default connect<any, any, any>((state, { value, valueKey, defaultValue }: ColorPickerConnectProps) => {
    return {
        value: valueKey ? get(getActiveElement(state), valueKey, defaultValue) : value
    };
})(React.memo(ColorPicker));
