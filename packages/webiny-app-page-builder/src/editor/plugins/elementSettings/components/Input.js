// @flow
import * as React from "react";
import { connect } from "react-redux";
import { get } from "lodash";
import { pure } from "recompose";
import { Typography } from "webiny-ui/Typography";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input as InputCmp } from "webiny-ui/Input";
import { InputContainer } from "./StyledComponents";
import { getActiveElement } from "webiny-app-page-builder/editor/selectors";

type Props = {
    label: string,
    placeholder: string,
    value?: string | number,
    valueKey?: string,
    updateValue: Function,
    inputWidth?: number
};

const Input = pure(({ label, value, placeholder, updateValue, inputWidth }: Props) => {
    return (
        <Grid>
            <Cell span={4}>
                <Typography use={"overline"}>{label}</Typography>
            </Cell>
            <Cell span={8}>
                <InputContainer width={inputWidth}>
                    <InputCmp placeholder={placeholder} value={value} onChange={updateValue} />
                </InputContainer>
            </Cell>
        </Grid>
    );
});

export default connect((state, { value, valueKey, defaultValue }: Object) => {
    return {
        value: valueKey ? get(getActiveElement(state), valueKey, defaultValue) : value
    };
})(Input);
