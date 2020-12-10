import React from "react";
import { css } from "emotion";
import classNames from "classnames";
import { COLORS } from "./StyledComponents";
import { Typography } from "@webiny/ui/Typography";

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

const labelStyle = css({
    marginBottom: 8,
    padding: "0px 8px",
    "& span": {
        color: "var(--mdc-theme-text-primary-on-background)"
    }
});

const descriptionStyle = css({
    marginTop: 8,
    padding: "0px 8px",
    "& span": {
        color: "var(--mdc-theme-text-secondary-on-background)"
    }
});

type InputBoxProps = {
    value?: string | number;
    onChange: (value: any) => void;
    [key: string]: any;
};
const InputField = ({
    className,
    value,
    onChange,
    label,
    description,
    ...props
}: InputBoxProps) => {
    return (
        <>
            {label && (
                <div className={labelStyle}>
                    <Typography use={"subtitle2"}>{label}</Typography>
                </div>
            )}
            <input
                className={classNames(inputStyle, className)}
                value={value}
                onChange={({ target: { value } }) => {
                    onChange(value);
                }}
                {...props}
            />
            {description && (
                <div className={descriptionStyle}>
                    <Typography use={"caption"}>{description}</Typography>
                </div>
            )}
        </>
    );
};

export default React.memo(InputField);
