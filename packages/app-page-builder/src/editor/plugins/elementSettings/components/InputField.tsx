import React from "react";
import { css } from "emotion";
import classNames from "classnames";
import omit from "lodash/omit";
import { Typography } from "@webiny/ui/Typography";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { COLORS } from "./StyledComponents";
import { Validation } from "@webiny/form";

const inputStyle = css({
    boxSizing: "border-box",
    border: "1px solid var(--mdc-theme-on-background)",
    width: "100%",
    padding: "4px 8px",
    textAlign: "left",
    minHeight: 32,
    backgroundColor: COLORS.lightGray,
    "&:focus:not(:disabled)": {
        backgroundColor: COLORS.gray
    },
    "&:hover:not(:disabled)": {
        backgroundColor: COLORS.gray
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

interface GetValueCallableParams {
    value: string | number;
    type: string;
    defaultValue: string | number;
}
interface GetValueCallable {
    (params: GetValueCallableParams): string | number;
}
const getValue: GetValueCallable = ({ value, defaultValue, type }) => {
    if (type === "number") {
        return isNaN(value as number) ? defaultValue : value;
    }
    return value || defaultValue;
};

interface InputBoxProps {
    value?: string | number;
    onChange?: (value: string) => void;
    defaultValue?: string | number;
    description?: string;
    label?: string;
    className?: string;
    validation?: Validation;
    type?: "string" | "number";
    [key: string]: any;
}
const InputField: React.FC<InputBoxProps> = ({
    className,
    value,
    onChange,
    label,
    description,
    validation = {
        isValid: true
    },
    defaultValue = "",
    ...props
}) => {
    return (
        <React.Fragment>
            {label && (
                <div className={labelStyle}>
                    <Typography use={"body2"}>{label}</Typography>
                </div>
            )}
            <input
                className={classNames(inputStyle, className)}
                value={getValue({
                    value: value as string,
                    type: props.type || "string",
                    defaultValue
                })}
                onChange={({ target: { value } }) => {
                    if (!onChange) {
                        return;
                    }
                    onChange(value);
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
