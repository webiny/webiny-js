import React from "react";
import { css } from "emotion";
import classNames from "classnames";
import { COLORS } from "./StyledComponents";

const inputStyle = css({
    boxSizing: "border-box",
    border: "1px solid var(--mdc-theme-on-background)",
    width: "100%",
    height: "100%",
    padding: "4px 8px",
    textAlign: "left",
    minHeight: 32,
    backgroundColor: COLORS.lightGray,

    "&.text-center": {
        textAlign: "center",
        padding: 4
    },

    "&::-webkit-inner-spin-button": {
        "-webkit-appearance": "none",
        margin: 0
    },
    "&::-webkit-outer-spin-button": {
        "-webkit-appearance": "none",
        margin: 0
    }
});

type InputBoxProps = {
    value?: string | number;
    onChange: (value: any) => void;
    [key: string]: any;
};
const InputField = ({ className, value, onChange, ...props }: InputBoxProps) => {
    return (
        <input
            className={classNames(inputStyle, className)}
            value={value}
            onChange={({ target: { value } }) => {
                onChange(value);
            }}
            {...props}
        />
    );
};

export default React.memo(InputField);
