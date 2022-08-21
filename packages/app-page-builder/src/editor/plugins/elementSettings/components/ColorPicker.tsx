import React from "react";
import lodashGet from "lodash/get";
import ColorPickerCmp from "../../../components/ColorPicker/ColorPicker";
import { activeElementAtom, elementByIdSelector } from "../../../recoil/modules";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { useRecoilValue } from "recoil";

const extrapolateActiveElementValue = (
    value?: string,
    valueKey?: string,
    defaultValue?: string
): string => {
    if (!valueKey) {
        return value || "";
    }
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(elementByIdSelector(activeElementId as string));
    if (!element) {
        throw new Error("There is no active element.");
    }
    return lodashGet(element, valueKey, defaultValue || "");
};

interface ColorPickerProps {
    label: string;
    value?: string;
    valueKey?: string;
    defaultValue?: string;
    updatePreview: Function;
    updateValue: Function;
    className?: string;
    handlerClassName?: string;
    "data-testid"?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
    label,
    value,
    valueKey,
    defaultValue,
    updatePreview,
    updateValue,
    className
}) => {
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

type BaseColorPickerComponent = Omit<ColorPickerProps, "label">;
export const BaseColorPickerComponent: React.FC<BaseColorPickerComponent> = (props) => {
    const {
        value,
        valueKey,
        defaultValue,
        updatePreview,
        updateValue,
        handlerClassName
    } = props;
    const targetValue = extrapolateActiveElementValue(value, valueKey, defaultValue);
    return (
        <ColorPickerCmp
            data-testid={props['data-testid']}
            handlerClassName={handlerClassName}
            compact
            value={targetValue}
            onChange={updatePreview}
            onChangeComplete={updateValue}
        />
    );
};

export const BaseColorPicker = React.memo(BaseColorPickerComponent);
