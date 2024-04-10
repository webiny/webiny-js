import React, { useEffect } from "react";
import { useStateIfMounted } from "@webiny/app-admin";
import { Input } from "@webiny/ui/Input";

interface TextInputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
}

const TextInput = ({ label, value, onChange, onBlur }: TextInputProps) => {
    const [localValue, setLocalValue] = useStateIfMounted(value);

    useEffect(() => {
        if (localValue !== value) {
            setLocalValue(value);
        }
    }, [value]);

    return (
        <Input
            label={label}
            value={localValue}
            onChange={value => {
                onChange(value);
                setLocalValue(value);
            }}
            onBlur={onBlur}
        />
    );
};

export default TextInput;
