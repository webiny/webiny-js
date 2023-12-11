import React, { useState, useEffect, useCallback } from "react";
import { css } from "emotion";
import classNames from "classnames";
import omit from "lodash/omit";
import { Typography } from "@webiny/ui/Typography";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { COLORS } from "./StyledComponents";
import { Validation } from "@webiny/form";
import debounce from "lodash/debounce";

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

const InputField = ({
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
}: InputBoxProps) => {
    // We introduced the local value concept in order to fix the cursor positioning issue.
    // Basically, users would type into the field, and the cursor would jump to the end of the input field.
    // This is because the value was being set from the outside, and the component was re-rendering.
    // By introducing the local value, we can control when the value is updated.
    // Original PR: https://github.com/webiny/webiny-js/pull/3146

    // Also note that we've tried to get rid of this and fix the root issue that's causing
    // the cursor to jump to the end of the input field, but we couldn't find a solution.
    // This was mainly because of the async nature of the onChange callback. For example,
    // if we removed the async validation in PropertySettings.tsx, the cursor would no longer jump.
    const [localValue, setLocalValue] = useState<string | number | undefined>();

    const debouncedSetLocalValue = useCallback(
        debounce(value => {
            setLocalValue(value);
        }, 100),
        []
    );

    // On all outside changes, we need to update the local value. Note the debounced
    // `setLocalValue` call. This resolves the issue where the cursor would jump to
    // the end of the input field while typing.
    useEffect(() => {
        debouncedSetLocalValue(value);
    }, [localValue, value]);

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
                    value: localValue as string,
                    type: props.type || "string",
                    defaultValue
                })}
                onChange={({ target: { value } }) => {
                    if (!onChange) {
                        return;
                    }
                    onChange(value);
                    setLocalValue(value);
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
