import React from "react";
import { LexicalEditor as BaseLexicalEditor } from "@webiny/app-admin";
import { StaticToolbar } from "@webiny/lexical-editor";
import type { EditorTheme } from "@webiny/lexical-theme";
import { createLexicalTokens } from "@webiny/lexical-theme/createLexicalEditorTokens.js";
import { useWebsiteBuilderTheme } from "~/BaseEditor/components/index.js";
import "./wbStaticToolbar.css";
import { CompositionScope } from "@webiny/app-admin";

const placeholderStyles: React.CSSProperties = { position: "absolute", top: 8, left: 12 };

const contentEditableStyles: React.CSSProperties = {
    minHeight: 200,
    display: "block",
    padding: "8px 12px"
};

const styles: React.CSSProperties = {
    backgroundColor: "var(--color-neutral-base)",
    border: "1px solid var(--border-color-neutral-muted)",
    // The static toolbar carries the top border; the body drops it and rounds only the
    // bottom corners so the two read as one seamless rounded box (matches Figma).
    borderTop: "none",
    borderRadius: "0 0 var(--radius-md) var(--radius-md)",
    // Padding lives on the contentEditable only (avoids doubled inset).
    minHeight: 200,
    maxHeight: 350,
    fontFamily: "var(--wb-theme-font-family)"
};

const lexicalTokens = createLexicalTokens("wb-lx-");

export type LexicalEditorProps = Omit<React.ComponentProps<typeof BaseLexicalEditor>, "theme">;

const LexicalEditorComponent = (props: LexicalEditorProps) => {
    const { theme } = useWebsiteBuilderTheme();

    const editorTheme: EditorTheme = {
        colors: theme?.colors ?? [],
        typography: theme?.typography ?? {},
        fontSizes: theme?.fontSizes ?? [],
        tokens: lexicalTokens
    };

    return (
        <BaseLexicalEditor
            {...props}
            staticToolbar={<StaticToolbar className={"wb-static-toolbar"} />}
            tag={"p"}
            placeholder={props?.placeholder || "Enter your text here..."}
            placeholderStyles={placeholderStyles}
            contentEditableStyles={contentEditableStyles}
            styles={styles}
            theme={editorTheme}
        />
    );
};

const ExpandedLexicalEditor = (props: LexicalEditorProps) => {
    return (
        <CompositionScope name={"expanded"}>
            <LexicalEditorComponent {...props} />
        </CompositionScope>
    );
};

const CompactLexicalEditor = (props: LexicalEditorProps) => {
    return (
        <CompositionScope name={"compact"}>
            <LexicalEditorComponent {...props} />
        </CompositionScope>
    );
};

export const LexicalEditor = {
    Expanded: ExpandedLexicalEditor,
    Compact: CompactLexicalEditor
};
