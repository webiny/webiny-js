import React, { useCallback, useState } from "react";
import { createComponentPlugin } from "@webiny/react-composition";
import RichVariableInput from "@webiny/app-page-builder/editor/plugins/elementSettings/variable/RichVariableInput";
import styled from "@emotion/styled";
import { ReactComponent as ExpandIcon } from "@material-design-icons/svg/filled/fullscreen.svg";
import { Dialog, DialogActions, DialogContent } from "@webiny/ui/Dialog";
import { ButtonPrimary, IconButton } from "@webiny/ui/Button";
import { useVariable } from "@webiny/app-page-builder/hooks/useVariable";
import { LexicalEditor } from "~/LexicalEditor";

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

export const RichVariableInputPlugin = createComponentPlugin(RichVariableInput, () => {
    return function RichVariableInputPlugin({ variableId }): JSX.Element {
        const { value, onChange, onBlur } = useVariable(variableId);
        const [initialValue, setInitialValue] = useState(value);
        const [isOpen, setIsOpen] = useState(false);

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

        const changeHandler = (json: string) => {
            onChange(json);
        };

        return (
            <InputWrapper>
                <IconButton icon={<ExpandIcon />} onClick={onOpen} />
                <EditorWrapper className="webiny-pb-page-element-text">
                    <LexicalEditor tag={"p"} value={initialValue} onChange={changeHandler} />
                </EditorWrapper>
                <Dialog open={isOpen} onClose={onClose}>
                    <DialogContent>
                        <ModalEditorWrapper className="webiny-pb-page-element-text">
                            <LexicalEditor
                                tag={"p"}
                                value={initialValue}
                                onChange={changeHandler}
                            />
                        </ModalEditorWrapper>
                    </DialogContent>
                    <DialogActions>
                        <ButtonPrimaryStyled onClick={onClose}>Save</ButtonPrimaryStyled>
                    </DialogActions>
                </Dialog>
            </InputWrapper>
        );
    };
});
