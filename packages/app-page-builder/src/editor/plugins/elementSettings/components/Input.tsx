import React from "react";
import { activeElementAtom, elementByIdSelector } from "../../../recoil/modules";
import get from "lodash/get";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input as InputCmp } from "@webiny/ui/Input";
import { useRecoilValue } from "recoil";
import { InputContainer } from "./StyledComponents";

interface InputPropsType {
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
    containerClassName?: string;
}

const Input = ({
    label,
    value,
    valueKey,
    defaultValue,
    placeholder,
    updateValue,
    inputWidth,
    className,
    containerClassName
}: InputPropsType) => {
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(elementByIdSelector(activeElementId as string));
    const keyValue = valueKey ? get(element, valueKey, defaultValue) : value;
    return (
        <Grid className={containerClassName}>
            <Cell span={4}>
                <Typography use={"overline"}>{label}</Typography>
            </Cell>
            <Cell span={8}>
                <InputContainer className={className} width={inputWidth}>
                    <InputCmp placeholder={placeholder} value={keyValue} onChange={updateValue} />
                </InputContainer>
            </Cell>
        </Grid>
    );
};

export default React.memo(Input);
