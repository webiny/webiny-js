import React, { useEffect, useState } from "react";
import { Input } from "@webiny/ui/Input";
import { useVariable } from "~/hooks/useVariable";

const textToBlockQuote = (text: string) => {
    return `<blockquote><q>${text}</q></blockquote>`;
};

const blockQuoteToText = (text: string) => {
    return text.replace("<blockquote><q>", "").replace("</q></blockquote>", "");
};

interface QuoteVariableInputProps {
    variableId: string;
}

const QuoteVariableInput: React.FC<QuoteVariableInputProps> = ({ variableId }) => {
    const { value, onChange, onBlur } = useVariable(variableId);
    const [localValue, setLocalValue] = useState(blockQuoteToText(value));

    useEffect(() => {
        if (localValue !== value) {
            setLocalValue(value);
        }
    }, [value]);

    return (
        <Input
            value={blockQuoteToText(localValue)}
            onChange={value => {
                onChange(textToBlockQuote(value));
                setLocalValue(textToBlockQuote(value));
            }}
            onBlur={onBlur}
        />
    );
};

export default QuoteVariableInput;
