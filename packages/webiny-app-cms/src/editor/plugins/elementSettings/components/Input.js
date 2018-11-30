// @flow
import * as React from "react";
import { pure } from "recompose";
import { Typography } from "webiny-ui/Typography";
import { Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { InputContainer } from "./StyledComponents";

type Props = {
    label: string,
    value: string,
    updateValue: Function
};

export default pure(({ label, value, updateValue }: Props) => {
    return (
        <React.Fragment>
            <Cell span={4}>
                <Typography use={"overline"}>{label}</Typography>
            </Cell>
            <Cell span={8}>
                <InputContainer>
                    <Input
                        value={value}
                        onChange={updateValue}
                    />
                </InputContainer>
            </Cell>
        </React.Fragment>
    );
});
