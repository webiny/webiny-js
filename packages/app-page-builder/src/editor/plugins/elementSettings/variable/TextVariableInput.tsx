import React, { useEffect, useState } from "react";
import { Input } from "@webiny/ui/Input";
import { makeDecoratable } from "@webiny/app-admin";
import { useVariable } from "~/hooks/useVariable";

interface TextVariableInputProps {
    variableId: string;
}

const TextVariableInput = makeDecoratable(
    "TextVariableInput",
    ({ variableId }: TextVariableInputProps) => {
        const { value, onChange, onBlur } = useVariable(variableId);
        const [localValue, setLocalValue] = useState(value);

        useEffect(() => {
            if (localValue !== value) {
                setLocalValue(value);
            }
        }, [value]);

        return (
            <Input
                value={localValue}
                onChange={value => {
                    onChange(value);
                    setLocalValue(value);
                }}
                onBlur={onBlur}
            />
        );
    }
);

export default TextVariableInput;
