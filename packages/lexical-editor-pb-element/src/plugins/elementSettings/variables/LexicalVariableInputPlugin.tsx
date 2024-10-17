import React, { useCallback, useEffect, useState } from "react";
import { ReactComponent as ExpandIcon } from "@material-design-icons/svg/filled/fullscreen.svg";
import { Dialog, DialogActions, DialogContent } from "@webiny/ui/Dialog";
import { ButtonPrimary, IconButton } from "@webiny/ui/Button";
import { useVariable } from "@webiny/app-page-builder/hooks/useVariable";
import { LexicalEditor } from "~/LexicalEditor";
import styled from "@emotion/styled";
import { LexicalValue } from "@webiny/lexical-editor/types";

const InputWrapper = styled.div`
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

const EditorWrapper = styled.div`
    padding: 20px 16px;
    margin-top: 8px;
    background-color: rgba(212, 212, 212, 0.5);
    border-bottom: 1px solid;
    max-height: 250px;
    overflow-y: auto;
    line-height: normal;
`;

const ModalEditorWrapper = styled.div`
    padding: 20px 16px;
    background-color: rgba(212, 212, 212, 0.5);
    border-bottom: 1px solid;
    width: 700px;
    height: 400px;
    overflow-y: auto;
    line-height: normal;
`;

const ButtonPrimaryStyled = styled(ButtonPrimary)`
    margin-left: 8px;
`;

interface LexicalVariableInputPluginProps {
    type: "paragraph" | "heading";
    variableId: string;
}
export const LexicalVariableInputPlugin = ({
    type,
    variableId
}: LexicalVariableInputPluginProps): JSX.Element => {
    const { value, onChange } = useVariable<LexicalValue>(variableId);
    const [initialValue, setInitialValue] = useState(value);
    // We need a separate piece of state for dialog input, to support "cancel edit" functionality
    const [dialogEditorValue, setDialogEditorValue] = useState(value);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    // Dialog input focus
    const [dialogInputFocused, setDialogInputFocused] = useState<boolean>(false);

    useEffect(() => {
        if (initialValue !== value) {
            setInitialValue(value);
        }
    }, [value]);

    const onInputChange = useCallback((data: LexicalValue) => {
        onChange(data, false);
    }, []);

    const onInputBlur = useCallback((data: LexicalValue) => {
        onChange(data, true);
    }, []);

    const onDialogOpenClick = useCallback(() => {
        setDialogEditorValue(initialValue);
        setIsDialogOpen(true);
    }, [initialValue]);

    const onDialogOpenedEvent = useCallback(() => {
        setDialogInputFocused(true);
    }, []);

    const onDialogClose = useCallback(() => {
        setIsDialogOpen(false);
        setDialogInputFocused(false);
    }, []);

    const onDialogSave = useCallback(() => {
        onChange(dialogEditorValue, true);
        setIsDialogOpen(false);
        setDialogInputFocused(false);
    }, [dialogEditorValue]);

    return (
        <InputWrapper>
            <IconButton icon={<ExpandIcon />} onClick={onDialogOpenClick} />
            <EditorWrapper className="webiny-pb-page-element-text">
                <LexicalEditor
                    type={type}
                    value={initialValue}
                    onChange={onInputChange}
                    onBlur={onInputBlur}
                />
            </EditorWrapper>
            <Dialog
                onOpened={onDialogOpenedEvent}
                open={isDialogOpen}
                onClose={onDialogClose}
                preventOutsideDismiss={false}
            >
                <DialogContent>
                    <ModalEditorWrapper className="webiny-pb-page-element-text">
                        <LexicalEditor
                            type={type}
                            value={initialValue}
                            onChange={setDialogEditorValue}
                            focus={dialogInputFocused}
                            height="100%"
                        />
                    </ModalEditorWrapper>
                </DialogContent>
                <DialogActions>
                    <ButtonPrimaryStyled className={"save-btn"} onClick={onDialogSave}>
                        Save
                    </ButtonPrimaryStyled>
                </DialogActions>
            </Dialog>
        </InputWrapper>
    );
};
