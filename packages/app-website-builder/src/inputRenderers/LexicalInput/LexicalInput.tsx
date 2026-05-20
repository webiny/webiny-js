import React, { useCallback, useEffect, useState } from "react";
import { Dialog, FormComponentLabel } from "@webiny/admin-ui";
import type { RichTextValueWithHtml } from "@webiny/app-admin";
import { LexicalEditor } from "./LexicalEditor.js";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";
import {
    ExpandedEditorProvider,
    useExpandedEditor
} from "~/inputRenderers/LexicalInput/ExpandedEditor.js";

type LexicalInputRendererProps = Omit<ElementInputRendererProps, "onChange" | "metadata"> & {
    onChange: (value: RichTextValueWithHtml) => void;
};

export const LexicalInputRenderer = (props: ElementInputRendererProps) => {
    const onChange = (lexicalValue: RichTextValueWithHtml) => {
        props.onChange(({ value }) => {
            value.set(lexicalValue);
        });
    };

    const value = props.value ?? {};

    return (
        <ExpandedEditorProvider>
            <ExpandableLexicalInputRenderer {...props} value={value} onChange={onChange} />
        </ExpandedEditorProvider>
    );
};

interface EditorDialogProps extends Omit<LexicalInputRendererProps, "onPreviewChange" | "label"> {
    open: boolean;
    onClose: () => void;
}

const EditorDialog = (props: EditorDialogProps) => {
    const [localValue, setLocalValue] = useState(props.value);

    useEffect(() => {
        setLocalValue(props.value);
    }, [props.value]);

    return (
        <Dialog
            id={"lexical-editor-dialog"}
            open={props.open}
            className={"w-[900px] max-w-[900px] overflow-visible"}
            data-hover-manager={"ignore"}
            title={`Edit ${props.input.label}`}
            dismissible={false}
            showCloseButton={false}
            actions={
                <>
                    <Dialog.CancelAction onClick={props.onClose} />
                    <Dialog.ConfirmAction
                        text={"Save Changes"}
                        onClick={() => {
                            props.onChange(localValue);
                        }}
                    />
                </>
            }
        >
            <LexicalEditor.Expanded value={localValue} onChange={setLocalValue} />
        </Dialog>
    );
};

const ExpandableLexicalInputRenderer = ({
    value,
    onChange,
    input,
    label
}: LexicalInputRendererProps) => {
    const { isExpanded, setExpanded } = useExpandedEditor();

    const applyChanges = useCallback(
        (newValue: any) => {
            onChange(newValue);
            setExpanded(false);
        },
        [onChange, setExpanded]
    );

    return (
        <>
            <FormComponentLabel text={label} />
            <LexicalEditor.Compact value={value} onChange={onChange} key={input.name} />
            <EditorDialog
                open={isExpanded}
                value={value}
                onChange={applyChanges}
                onClose={() => setExpanded(false)}
                input={input}
            />
        </>
    );
};
