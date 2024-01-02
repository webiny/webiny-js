import React from "react";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Slider as SliderCmp } from "@webiny/ui/Slider";

interface SliderPropsType {
    label: string;
    value: string | number;
    updatePreview(value: any): void;
    updateValue(value: any): void;
    min?: number;
    max?: number;
    step?: number;
}

const Slider = ({
    label,
    value,
    updatePreview,
    updateValue,
    min = 0,
    max = 100,
    step = 1
}: SliderPropsType) => {
    return (
        <Grid>
            <Cell span={4}>
                <Typography use={"overline"}>{label}</Typography>
            </Cell>
            <Cell span={8}>
                <SliderCmp
                    value={value}
                    onChange={updateValue}
                    onInput={updatePreview}
                    min={min}
                    max={max}
                    discrete
                    step={step}
                />
            </Cell>
        </Grid>
    );
};

export default Slider;
