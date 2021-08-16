import React from "react";
import { FormComponentProps } from "@webiny/form";

interface InputProps extends FormComponentProps {
    placeholder: string;
}

// A simple Input component, that can be used with the `Form` component,
// imported from the `@webiny/form` package.
// https://github.com/webiny/webiny-js/tree/next/packages/form
export default function Input({ value, placeholder, validation, onChange }: InputProps) {
    return (
        <input
            className={validation.message ? "error" : ""}
            value={value}
            placeholder={validation.message || placeholder}
            type="text"
            onChange={e => onChange(e.target.value)}
        />
    );
}
