import React, { useState } from "react";
import styled from "@emotion/styled";
import { CoreOptions } from "medium-editor";
import ReactMediumEditor from "~/editor/components/MediumEditor";

const InputWrapper = styled("div")({
    padding: "20px 16px",
    backgroundColor: "rgba(212, 212, 212, 0.5)",
    borderBottom: "1px solid",

    "&:hover": {
        backgroundColor: "rgba(212, 212, 212, 0.7)"
    },

    "&>p": {
        minHeight: "auto",
        lineHeight: "normal"
    }
});

const DEFAULT_EDITOR_OPTIONS: CoreOptions = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor"]
    },
    anchor: {
        targetCheckbox: true,
        targetCheckboxText: "Open in a new tab"
    }
};

interface RichInputProps {
    value: string;
    onChange: (value: string) => void;
    onSelect: (value: string) => void;
    [key: string]: any;
}

const RichInput: React.FC<RichInputProps> = ({ value, onChange, onSelect }) => {
    const [initialValue] = useState(value);

    return (
        <InputWrapper className="webiny-pb-page-element-text">
            <ReactMediumEditor
                tag="p"
                value={initialValue}
                onChange={onChange}
                onSelect={onSelect}
                options={DEFAULT_EDITOR_OPTIONS}
            />
        </InputWrapper>
    );
};

export default RichInput;
