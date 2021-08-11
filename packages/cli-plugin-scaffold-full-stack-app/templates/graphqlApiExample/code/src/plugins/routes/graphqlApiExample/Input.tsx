import React from "react";
import { FormComponentProps } from "@webiny/form";

interface InputProps extends FormComponentProps {
    placeholder: string;
}

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
