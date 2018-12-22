// @flow
import * as React from "react";
import { pure } from "recompose";
import { Typography } from "webiny-ui/Typography";
import { Cell } from "webiny-ui/Grid";
import { Select } from "webiny-ui/Select";
import { InputContainer } from "./StyledComponents";

type Props = {
    label: string,
    value: string,
    updateValue: Function,
    options?: Array<string>,
    // One or more <option> or <optgroup> elements.
    children?: React.ChildrenArray<React.Element<"option"> | React.Element<"optgroup">>
};

export default pure(({ label, value, updateValue, options, children }: Props) => {
    return (
        <>
            <Cell span={4}>
                <Typography use={"overline"}>{label}</Typography>
            </Cell>
            <Cell span={8}>
                <InputContainer>
                    <Select value={value} onChange={updateValue} options={options}>
                        {children}
                    </Select>
                </InputContainer>
            </Cell>
        </>
    );
});
