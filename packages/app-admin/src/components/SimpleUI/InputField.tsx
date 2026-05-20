import React from "react";
import { css } from "@emotion/css";
import classNames from "classnames";
import omit from "lodash/omit.js";
import { Text, FormComponentErrorMessage, FormComponentNote } from "@webiny/admin-ui";

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

interface GetValueParams {
    value: string | number | undefined;
    defaultValue: string | number;
    type: "number" | "string";
}
const getValue = (params: GetValueParams): string => {
    const { value, defaultValue, type } = params;
    if (type === "number") {
        return (isNaN(value as number) ? defaultValue : value) as string;
    }
    return (value || defaultValue) as string;
};

export type OnKeyDownProps = React.SyntheticEvent<HTMLInputElement, Event> &
    React.KeyboardEvent<HTMLInputElement>;

interface InputBoxProps {
    value?: string | number;
    onChange?: (value: any) => void;
    onKeyDown?: (e: OnKeyDownProps) => any;
    defaultValue?: string | number;
    type?: "string" | "number";
    [key: string]: any;
}
const InputField = ({
    className,
    value,
    onChange,
    onKeyDown,
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
                    <Text size={"sm"}>{label}</Text>
                </div>
            )}
            <input
                className={classNames(inputStyle, className)}
                value={getValue({
                    value,
                    type: props.type || "string",
                    defaultValue
                })}
                onKeyDown={onKeyDown}
                onChange={ev => {
                    if (!onChange) {
                        return;
                    }
                    onChange((ev.target.value || "").toLowerCase());
                }}
                {...omit(props, "validate")}
            />
            {validation.isValid === false && (
                <FormComponentErrorMessage text={validation.message} invalid={true} />
            )}
            {validation.isValid !== false && description && (
                <FormComponentNote text={description} />
            )}
        </React.Fragment>
    );
};

export default React.memo(InputField);
