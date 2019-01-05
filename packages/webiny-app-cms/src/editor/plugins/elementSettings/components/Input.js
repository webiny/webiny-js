// @flow
import * as React from "react";
import { pure } from "recompose";
import { Typography } from "webiny-ui/Typography";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { InputContainer } from "./StyledComponents";

type Props = {
    label: string,
    value: string | number,
    updateValue: Function,
    inputWidth?: number
};

export default pure(({ label, value, updateValue, inputWidth }: Props) => {
    return (
        <Grid>
            <Cell span={4}>
                <Typography use={"overline"}>{label}</Typography>
            </Cell>
            <Cell span={8}>
                <InputContainer width={inputWidth}>
                    <Input value={value} onChange={updateValue} />
                </InputContainer>
            </Cell>
        </Grid>
    );
});
