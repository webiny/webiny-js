import React, { useCallback, useState } from "react";
import styled from "@emotion/styled";
import { CoreOptions } from "medium-editor";
import { Dialog, DialogCancel, DialogActions, DialogContent } from "@webiny/ui/Dialog";
import { ButtonPrimary } from "@webiny/ui/Button";
import { SimpleButton } from "~/editor/plugins/elementSettings/components/StyledComponents";
import ReactMediumEditor from "~/editor/components/MediumEditor";
import { useVariable } from "~/hooks/useVariable";

const InputWrapper = styled("div")`
    padding: 20px 16px;
    background-color: rgba(212, 212, 212, 0.5);
    border-bottom: 1px solid;
    width: 700px;
    height: 400px;
    overflow-y: auto;

    &:has(p[data-medium-focused]) {
        background-color: rgba(212, 212, 212, 0.7);
    }

    & > p {
        min-height: auto;
        line-height: normal;
    }
`;

const ButtonPrimaryStyled = styled(ButtonPrimary)`
    margin-left: 8px;
`;

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
    const { value, onChange } = useVariable(variableId);
    const [localValue, setLocalValue] = useState(value);
    const [isOpen, setIsOpen] = useState(false);

    const onOpen = useCallback(() => {
        setIsOpen(true);
    }, []);

    const onClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    const onValueChange = useCallback((value: string) => {
        setLocalValue(value);
    }, []);

    const onSave = useCallback(() => {
        onChange(localValue, true);
        onClose();
    }, [localValue, onChange, onClose]);

    return (
        <>
            <SimpleButton onClick={onOpen}>Edit</SimpleButton>
            <Dialog open={isOpen} onClose={onClose}>
                <DialogContent>
                    <InputWrapper className="webiny-pb-page-element-text">
                        <ReactMediumEditor
                            tag="p"
                            value={value}
                            onChange={onValueChange}
                            onSelect={onValueChange}
                            options={DEFAULT_EDITOR_OPTIONS}
                        />
                    </InputWrapper>
                </DialogContent>
                <DialogActions>
                    <DialogCancel>Cancel</DialogCancel>
                    <ButtonPrimaryStyled onClick={onSave}>Save</ButtonPrimaryStyled>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default RichVariableInput;
