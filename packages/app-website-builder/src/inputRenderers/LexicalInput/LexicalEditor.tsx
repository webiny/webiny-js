import React, { useCallback } from "react";
import { RichTextEditor, StaticToolbar } from "@webiny/lexical-editor";
import type { RichTextEditorProps } from "@webiny/lexical-editor/types";
import { FileManager } from "@webiny/app-admin";
import { EditorTheme } from "@webiny/lexical-theme";
import { useWebsiteBuilderTheme } from "~/BaseEditor/components";
import "./wbStaticToolbar.css";

const placeholderStyles: React.CSSProperties = { position: "absolute", top: 40, left: 25 };

const contentEditableStyles: React.CSSProperties = {
    minHeight: 200,
    display: "block",
    padding: 10
};

const styles: React.CSSProperties = {
    backgroundColor: "#fff",
    border: "1px solid #e1e1e1",
    padding: "10px 14px",
    minHeight: 200,
    maxHeight: 350,
    fontFamily: "var(--wb-theme-font-family)"
};

const toolbar = <StaticToolbar className={"wb-static-toolbar"} />;

export const LexicalEditor = (props: Omit<RichTextEditorProps, "theme">) => {
    const { theme } = useWebsiteBuilderTheme();

    const onChange = useCallback(
        (jsonString: string) => {
            if (props?.onChange) {
                props?.onChange(jsonString);
            }
        },
        [props?.onChange]
    );

    const editorTheme: EditorTheme = {
        emotionMap: {},
        styles: theme?.styles ?? {},
        ...theme?.lexical
    };

    /**
     * To use Website Builder theme, we can't use the LexicalEditor component from @webiny/app-admin.
     */
    return (
        <FileManager accept={["image/*"]}>
            {({ showFileManager }) => (
                <RichTextEditor
                    {...props}
                    onChange={onChange}
                    staticToolbar={toolbar}
                    tag={"p"}
                    placeholder={props?.placeholder || "Enter your text here..."}
                    placeholderStyles={placeholderStyles}
                    contentEditableStyles={contentEditableStyles}
                    styles={styles}
                    theme={editorTheme}
                    toolbarActionPlugins={[
                        ...(props.toolbarActionPlugins || []),
                        { targetAction: "image-action", plugin: showFileManager }
                    ]}
                />
            )}
        </FileManager>
    );
};
