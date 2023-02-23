import React, { useEffect, useState } from "react";
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

interface LexicalVariableInputPlugin {
    tag: string;
    variableId: string;
}
export const LexicalVariableInputPlugin: React.FC<LexicalVariableInputPlugin> = ({
    tag,
    variableId
}): JSX.Element => {
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

    const onInputChange = (data: LexicalValue) => {
        onChange(data, true);
    };

    const onDialogOpenClick = () => {
        setDialogEditorValue(initialValue);
        setIsDialogOpen(true);
    };

    const onDialogOpenedEvent = () => {
        setDialogInputFocused(true);
    };

    const onDialogClose = () => {
        setIsDialogOpen(false);
        setDialogInputFocused(false);
    };

    const onDialogSave = () => {
        onChange(dialogEditorValue, true);
        setIsDialogOpen(false);
        setDialogInputFocused(false);
    };

    return (
        <InputWrapper>
            <IconButton icon={<ExpandIcon />} onClick={onDialogOpenClick} />
            <EditorWrapper className="webiny-pb-page-element-text">
                <LexicalEditor
                    tag={tag}
                    value={initialValue}
                    onChange={data => onInputChange(data)}
                />
            </EditorWrapper>
            <Dialog
                onOpened={onDialogOpenedEvent}
                open={isDialogOpen}
                onClose={() => onDialogClose()}
                preventOutsideDismiss={false}
            >
                <DialogContent>
                    <ModalEditorWrapper className="webiny-pb-page-element-text">
                        <LexicalEditor
                            tag={tag}
                            value={initialValue}
                            onChange={data => setDialogEditorValue(data)}
                            focus={dialogInputFocused}
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
