import React from "react";
import omit from "lodash/omit.js";
import { cn, Text, FormComponentErrorMessage, FormComponentNote } from "@webiny/admin-ui";

const inputStyle = [
    "box-border w-full h-full min-h-[32px] py-xs px-sm text-left transition-all duration-150 ease-in-out",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "[&.text-center]:text-center [&.text-center]:p-xs",
    "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0",
    "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0"
].join(" ");

const labelStyle = "mb-sm px-sm";

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
                className={cn(inputStyle, className)}
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
