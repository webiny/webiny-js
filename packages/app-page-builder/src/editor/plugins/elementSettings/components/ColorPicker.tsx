import React from "react";
import lodashGet from "lodash/get";
import ColorPickerCmp from "@webiny/app-page-builder/editor/components/ColorPicker/ColorPicker";
import { activeElementSelector } from "@webiny/app-page-builder/editor/recoil/modules";
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
    value?: string;
    valueKey?: string;
    defaultValue?: string;
    updatePreview: Function;
    updateValue: Function;
    className?: string;
    handlerClassName?: string;
};

const ColorPicker = ({
    label,
    value,
    valueKey,
    defaultValue,
    updatePreview,
    updateValue,
    className
}: ColorPickerProps) => {
    const targetValue = extrapolateActiveElementValue(value, valueKey, defaultValue);
    return (
        <Grid className={className}>
            <Cell span={4}>
                <Typography use={"subtitle2"}>{label}</Typography>
            </Cell>
            <Cell span={8}>
                <ColorPickerCmp
                    compact
                    value={targetValue}
                    onChange={updatePreview}
                    onChangeComplete={updateValue}
                />
            </Cell>
        </Grid>
    );
};

export default React.memo(ColorPicker);

export const BaseColorPickerComponent = ({
    value,
    valueKey,
    defaultValue,
    updatePreview,
    updateValue,
    handlerClassName
}: Partial<ColorPickerProps>) => {
    const targetValue = extrapolateActiveElementValue(value, valueKey, defaultValue);
    return (
        <ColorPickerCmp
            handlerClassName={handlerClassName}
            compact
            value={targetValue}
            onChange={updatePreview}
            onChangeComplete={updateValue}
        />
    );
};

export const BaseColorPicker = React.memo(BaseColorPickerComponent);
