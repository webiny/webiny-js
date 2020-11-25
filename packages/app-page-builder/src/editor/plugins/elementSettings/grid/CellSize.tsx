import React from "react";
import styled from "@emotion/styled";
import { ButtonPrimary as Button } from "@webiny/ui/Button";

const InputSizeRowStyled = styled("div")({
    display: "flex",
    width: "100%",
    flexDirection: "row",
    alignContent: "center",
    margin: "0 0 5px 0",
    ":last-child": {
        margin: "0"
    }
});
const InputSizeCellStyled = styled("div")({
    width: "30%",
    boxSizing: "border-box",
    padding: "0 5px 0 0",
    textAlign: "right",
    alignContent: "center"
});
const InputValueWrapStyled = styled("div")({
    width: "auto",
    flexGrow: 1,
    display: "flex",
    flexDirection: "row"
});
const InputValueStyled = styled("div")({});

type CellSizePropsType = {
    value: number;
    maxAllowed: number;
    label: string;
    onChange: (value: number) => void;
};
const CellSize: React.FunctionComponent<CellSizePropsType> = ({
    value,
    label,
    onChange,
    maxAllowed
}) => {
    const onReduceHandler = () => {
        const newValue = value - 1;
        if (newValue <= 0) {
            return false;
        }
        onChange(newValue);
    };

    const onAddHandler = () => {
        if (maxAllowed <= 0) {
            return false;
        }
        onChange(value + 1);
    };

    return (
        <InputSizeRowStyled>
            <InputSizeCellStyled>{label}</InputSizeCellStyled>
            <InputValueWrapStyled>
                <Button onClick={onReduceHandler}>-</Button>
                <InputValueStyled>{value}</InputValueStyled>
                <Button onClick={onAddHandler}>+</Button>
            </InputValueWrapStyled>
        </InputSizeRowStyled>
    );
};

export default React.memo(CellSize);
