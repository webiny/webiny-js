import React from "react";
import { activeElementSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { get } from "lodash";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input as InputCmp } from "@webiny/ui/Input";
import { useRecoilValue } from "recoil";
import { InputContainer } from "./StyledComponents";

type InputPropsType = {
    label: string;
    placeholder?: string;
    value?: string | number;
    valueKey?: string;
    defaultValue?: any;
    updateValue: (value: any) => void;
    inputWidth?: number | string;
    // there is no use for this prop but some components are setting it
    description?: string;
    // TODO check - not used anywhere
    className?: string;
};

const Input: React.FunctionComponent<InputPropsType> = ({
    label,
    value,
    valueKey,
    defaultValue,
    placeholder,
    updateValue,
    inputWidth
}) => {
    const element = useRecoilValue(activeElementSelector);
    const keyValue = valueKey ? get(element, valueKey, defaultValue) : value;
    return (
        <Grid>
            <Cell span={4}>
                <Typography use={"overline"}>{label}</Typography>
            </Cell>
            <Cell span={8}>
                <InputContainer width={inputWidth}>
                    <InputCmp placeholder={placeholder} value={keyValue} onChange={updateValue} />
                </InputContainer>
            </Cell>
        </Grid>
    );
};

export default React.memo(Input);
