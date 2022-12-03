import React, { useState } from "react";
import styled from "@emotion/styled";
import { CoreOptions } from "medium-editor";
import ReactMediumEditor from "~/editor/components/MediumEditor";
import { useVariable } from "~/hooks/useVariable";

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

interface RichVariableInputProps {
    variableId: string;
}

const RichVariableInput: React.FC<RichVariableInputProps> = ({ variableId }) => {
    const { value, onChange, onBlur } = useVariable(variableId);
    const [initialValue] = useState(value);

    return (
        <InputWrapper className="webiny-pb-page-element-text">
            <ReactMediumEditor
                tag="p"
                value={initialValue}
                onChange={onBlur}
                onSelect={onChange}
                options={DEFAULT_EDITOR_OPTIONS}
            />
        </InputWrapper>
    );
};

export default RichVariableInput;
