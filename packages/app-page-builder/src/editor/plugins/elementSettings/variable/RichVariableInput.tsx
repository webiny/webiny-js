import React, { useCallback, useEffect, useState } from "react";
import styled from "@emotion/styled";
import { CoreOptions } from "medium-editor";
import { ReactComponent as ExpandIcon } from "@material-design-icons/svg/filled/fullscreen.svg";
import { makeDecoratable } from "@webiny/app-admin";
import { Dialog, DialogActions, DialogContent } from "@webiny/ui/Dialog";
import { ButtonPrimary, IconButton } from "@webiny/ui/Button";
import ReactMediumEditor from "~/editor/components/MediumEditor";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { useVariable } from "~/hooks/useVariable";

const InputWrapper = styled("div")`
    display: grid;
    align-items: flex-end;
    margin-top: -32px;

    & > button {
        margin-left: auto;
        width: 32px;
        height: 32px;
        padding: 4px;
    }
`;

const EditorWrapper = styled("div")`
    padding: 20px 16px;
    margin-top: 8px;
    background-color: rgba(212, 212, 212, 0.5);
    border-bottom: 1px solid;
    max-height: 250px;
    overflow-y: auto;
    line-height: normal;

    &:has(p[data-medium-focused]) {
        background-color: rgba(212, 212, 212, 0.7);
    }

    & .medium-editor-placeholder:after {
        color: var(--mdc-theme-text-secondary-on-background);
    }
`;

const ModalEditorWrapper = styled("div")`
    padding: 20px 16px;
    background-color: rgba(212, 212, 212, 0.5);
    border-bottom: 1px solid;
    width: 700px;
    height: 400px;
    overflow-y: auto;
    line-height: normal;

    &:has(p[data-medium-focused]) {
        background-color: rgba(212, 212, 212, 0.7);
    }

    & .medium-editor-placeholder:after {
        color: var(--mdc-theme-text-secondary-on-background);
    }
`;

const ButtonPrimaryStyled = styled(ButtonPrimary)`
    margin-left: 8px;
`;

const DEFAULT_EDITOR_OPTIONS: CoreOptions = {
    toolbar: {
        buttons: ["anchor"]
    },
    anchor: {
        targetCheckbox: true,
        targetCheckboxText: "Open in a new tab"
    }
};

interface RichVariableInputProps {
    variableId: string;
}

const RichVariableInput = makeDecoratable(
    "RichVariableInput",
    ({ variableId }: RichVariableInputProps) => {
        const [element] = useActiveElement();
        const { value, onChange, onBlur } = useVariable(variableId);
        const [initialValue, setInitialValue] = useState(value);
        const [isOpen, setIsOpen] = useState(false);

        useEffect(() => {
            setInitialValue(value);
        }, [element?.id]);

        const onOpen = useCallback(() => {
            setIsOpen(true);
        }, []);

        const onUpdate = useCallback(() => {
            onBlur();
            setInitialValue(value);
        }, [value, onBlur]);

        const onClose = useCallback(() => {
            onUpdate();
            setIsOpen(false);
        }, [onUpdate]);

        return (
            <InputWrapper>
                <IconButton icon={<ExpandIcon />} onClick={onOpen} />
                <EditorWrapper className="webiny-pb-page-element-text">
                    <ReactMediumEditor
                        tag="p"
                        value={initialValue}
                        onChange={onUpdate}
                        onSelect={onChange}
                        options={DEFAULT_EDITOR_OPTIONS}
                    />
                </EditorWrapper>
                <Dialog open={isOpen} onClose={onClose}>
                    <DialogContent>
                        <ModalEditorWrapper className="webiny-pb-page-element-text">
                            <ReactMediumEditor
                                tag="p"
                                value={initialValue}
                                onChange={onChange}
                                onSelect={onChange}
                                options={DEFAULT_EDITOR_OPTIONS}
                                autoFocus={isOpen}
                            />
                        </ModalEditorWrapper>
                    </DialogContent>
                    <DialogActions>
                        <ButtonPrimaryStyled onClick={onClose}>Save</ButtonPrimaryStyled>
                    </DialogActions>
                </Dialog>
            </InputWrapper>
        );
    }
);

export default RichVariableInput;
