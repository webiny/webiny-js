import React from "react";
import { css } from "emotion";
import classNames from "classnames";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { useRecoilValue } from "recoil";
import { activeElementSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { get } from "lodash";

import { COLORS } from "./StyledComponents";

const inputStyle = css({
    boxSizing: "border-box",
    border: "1px solid var(--mdc-theme-on-background)",
    width: "100%",
    height: "100%",
    padding: 4,
    textAlign: "center",
    minHeight: 32,
    backgroundColor: COLORS.lightGray
});

type WrappedInputProps = {
    value?: string | number;
    onChange: (value: any) => void;
    [key: string]: any;
};
const WrappedInput = ({ className, value, onChange, placeholder, ...props }: WrappedInputProps) => {
    return (
        <input
            className={classNames(inputStyle, className)}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            type={"number"}
            {...props}
        />
    );
};

export default React.memo(WrappedInput);

type InputPropsType = {
    label: string;
    placeholder?: string;
    value?: string | number;
    valueKey?: string;
    defaultValue?: any;
    updateValue: (value: any) => void;
    inputWidth?: number | string;
    className?: string;
    containerClassName?: string;
    leftCellSpan?: number;
    rightCellSpan?: number;
    [key: string]: any;
};

const Input = ({
    label,
    value,
    valueKey,
    defaultValue,
    updateValue,
    containerClassName,
    className,
    leftCellSpan,
    rightCellSpan,
    ...props
}: InputPropsType) => {
    const element = useRecoilValue(activeElementSelector);
    const keyValue = valueKey ? get(element, valueKey, defaultValue) : value;
    return (
        <Grid className={containerClassName}>
            <Cell span={leftCellSpan || 4}>
                <Typography use={"subtitle2"}>{label}</Typography>
            </Cell>
            <Cell span={rightCellSpan || 8}>
                <input
                    className={classNames(inputStyle, className)}
                    value={keyValue}
                    onChange={updateValue}
                    {...props}
                />
            </Cell>
        </Grid>
    );
};

export const InputBox = React.memo(Input);
