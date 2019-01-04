// @flow
import * as React from "react";
import { pure } from "recompose";
import { Typography } from "webiny-ui/Typography";
import { Grid, Cell } from "webiny-ui/Grid";
import { Slider } from "webiny-ui/Slider";

type Props = {
    label: string,
    value: string,
    updatePreview: Function,
    updateValue: Function,
    min: number,
    max: number,
    step: number
};

export default pure(
    ({ label, value, updatePreview, updateValue, min = 0, max = 100, step = 1 }: Props) => {
        return (
            <Grid>
                <Cell span={4}>
                    <Typography use={"overline"}>{label}</Typography>
                </Cell>
                <Cell span={8}>
                    <Slider
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
    }
);
