import * as React from "react";
import { connect } from "react-redux";
import { get } from "lodash";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input as InputCmp } from "@webiny/ui/Input";
import { InputContainer } from "./StyledComponents";
import { getActiveElement } from "@webiny/app-page-builder/editor/selectors";

type InputProps = {
    label: string;
    placeholder: string;
    value?: string | number;
    valueKey?: string;
    updateValue: (value: any) => void;
    inputWidth?: number;
};

const Input = ({ label, value, placeholder, updateValue, inputWidth }: InputProps) => {
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
};

export default connect<any, any, any>((state, { value, valueKey, defaultValue }: any) => {
    return {
        value: valueKey ? get(getActiveElement(state), valueKey, defaultValue) : value
    };
})(React.memo(Input));
