import React, { useEffect, useMemo, useRef } from "react";
import { FileManager } from "~/components/index.js";
import { RichTextEditor as BaseEditor } from "@webiny/lexical-editor";
import type { RichTextEditorProps } from "@webiny/lexical-editor/types.js";
import { DelayedOnChange } from "@webiny/admin-ui";
import { useAdminConfig } from "~/config/AdminConfig.js";
import { lexicalValueWithHtml, type RichTextValueWithHtml } from "./lexicalValueWithHtml.js";
import { lexicalValueFromHtml } from "./lexicalValueFromHtml.js";

export interface LexicalEditorProps extends Omit<
    RichTextEditorProps,
    "value" | "onChange" | "theme"
> {
    value?: RichTextValueWithHtml;
    onChange?: (value: RichTextValueWithHtml) => void;
    theme?: RichTextEditorProps["theme"];
}

const imagesOnly = ["image/*"];
const noop = () => {};

export const LexicalEditor = (props: LexicalEditorProps) => {
    const { lexicalTheme } = useAdminConfig();
    const configRef = useRef<BaseEditor.InitialConfig | undefined>(undefined);

    useEffect(() => {
        if (configRef.current && props.value?.html && !props.value.state && props.onChange) {
            lexicalValueFromHtml(configRef, props.onChange)(props.value.html);
        }
    }, [configRef.current, props.value, props.onChange]);

    const onChange = useMemo(() => {
        return lexicalValueWithHtml(configRef, props.onChange ?? noop);
    }, [props.onChange]);

    return (
        <FileManager
            accept={imagesOnly}
            render={({ showFileManager }) => (
                <DelayedOnChange value={props.value?.state} onChange={onChange}>
                    {({ value, onChange }) => (
                        <BaseEditor
                            {...props}
                            value={value}
                            onChange={onChange}
                            theme={props.theme ?? lexicalTheme}
                            configRef={configRef}
                            toolbarActionPlugins={[
                                ...(props.toolbarActionPlugins || []),
                                { targetAction: "image-action", plugin: showFileManager }
                            ]}
                        />
                    )}
                </DelayedOnChange>
            )}
        />
    );
};

export namespace LexicalEditor {
    export type Props = LexicalEditorProps;
}
