import * as React from "react";
import { connect } from "react-redux";
import { get } from "lodash";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { useRecoilValue } from "recoil";

const extrapolateActiveElementValue = (
    value?: string,
    valueKey?: string,
    defaultValue?: string
): string | undefined => {
    if (!valueKey) {
        return value;
    }
    const element = useRecoilValue(activeElementSelector);
    if (!element) {
        throw new Error("There is no active element.");
    }
    return lodashGet(element, valueKey, defaultValue);
};

type ColorPickerProps = {
    label: string;
    value: string;
    updatePreview: Function;
    updateValue: Function;
};

const ColorPicker = ({
    label,
    value,
    valueKey,
    defaultValue,
    updatePreview,
    updateValue
}: ColorPickerProps) => {
    const targetValue = extrapolateActiveElementValue(value, valueKey, defaultValue);
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

export default React.memo(ColorPicker);
