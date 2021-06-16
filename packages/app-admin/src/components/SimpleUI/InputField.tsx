import React from "react";
import { css } from "emotion";
import classNames from "classnames";
import omit from "lodash/omit";
import { Typography } from "@webiny/ui/Typography";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";

const inputStyle = css({
    boxSizing: "border-box",
    border: "1px solid var(--mdc-theme-on-background)",
    width: "100%",
    height: "100%",
    padding: "4px 8px",
    textAlign: "left",
    minHeight: 32,
    backgroundColor: "var(--mdc-theme-surface)",
    transition: "150ms all ease-in-out",
    "&:focus:not(:disabled)": {
        backgroundColor: "var(--mdc-theme-on-background)"
    },
    "&:hover:not(:disabled)": {
        backgroundColor: "var(--mdc-theme-on-background)"
    },
    "&:disabled": {
        opacity: 0.5,
        cursor: "not-allowed"
    },

    "&.text-center": {
        textAlign: "center",
        padding: 4
    },

    "&::-webkit-inner-spin-button": {
        WebkitAppearance: "none",
        margin: 0
    },
    "&::-webkit-outer-spin-button": {
        WebkitAppearance: "none",
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

const getValue = ({ value, defaultValue, type }) => {
    if (type === "number") {
        return isNaN(value) ? defaultValue : value;
    }
    return value || defaultValue;
};

type InputBoxProps = {
    value?: string | number;
    onChange?: (value: any) => void;
    defaultValue?: string | number;
    [key: string]: any;
};
const InputField = ({
    className,
    value,
    onChange,
    label,
    description,
    validation = { isValid: true },
    defaultValue = "",
    ...props
}: InputBoxProps) => {
    return (
        <React.Fragment>
            {label && (
                <div className={labelStyle}>
                    <Typography use={"subtitle2"}>{label}</Typography>
                </div>
            )}
            <input
                className={classNames(inputStyle, className)}
                value={getValue({ value, type: props.type, defaultValue })}
                onChange={({ target: { value } }) => {
                    onChange(value.toLowerCase());
                }}
                {...omit(props, "validate")}
            />
            {validation.isValid === false && (
                <FormElementMessage error>{validation.message}</FormElementMessage>
            )}
            {validation.isValid !== false && description && (
                <FormElementMessage>{description}</FormElementMessage>
            )}
        </React.Fragment>
    );
};

export default React.memo(InputField);
