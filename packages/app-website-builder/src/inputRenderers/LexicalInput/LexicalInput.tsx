import React, { useCallback, useEffect, useState } from "react";
import { Dialog, DelayedOnChange, FormComponentLabel } from "@webiny/admin-ui";
import { CompositionScope } from "@webiny/app-admin";
import type { RichTextValueWithHtml } from "@webiny/app-admin/components/LexicalEditor/index.js";
import { FloatingLinkEditorPlugin, LexicalEditorConfig } from "@webiny/lexical-editor";
import { LexicalEditor } from "./LexicalEditor.js";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";
import {
    ExpandedEditorProvider,
    useExpandedEditor
} from "~/inputRenderers/LexicalInput/ExpandedEditor.js";
import { LinkEditForm } from "~/inputRenderers/LexicalInput/LinkEditForm.js";
import { LinkPreviewForm } from "~/inputRenderers/LexicalInput/LinkPreviewForm.js";

const { Plugin } = LexicalEditorConfig;

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
            <CompositionScope name={"expanded"}>
                <DelayedOnChange value={localValue} onChange={setLocalValue}>
                    {({ value, onChange }) => <LexicalEditor value={value} onChange={onChange} />}
                </DelayedOnChange>
                <LexicalEditorConfig>
                    <Plugin
                        name={"floatingLinkEditor"}
                        element={
                            <FloatingLinkEditorPlugin
                                LinkEditForm={LinkEditForm}
                                LinkPreviewForm={LinkPreviewForm}
                            />
                        }
                    />
                </LexicalEditorConfig>
            </CompositionScope>
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
            <CompositionScope name={"compact"}>
                <DelayedOnChange value={value} onChange={onChange}>
                    {({ value, onChange }) => (
                        <LexicalEditor value={value} onChange={onChange} key={input.name} />
                    )}
                </DelayedOnChange>
            </CompositionScope>
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
