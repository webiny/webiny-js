import React from "react";
import { LexicalEditor as BaseLexicalEditor, AdminConfig } from "@webiny/app-admin";
import { StaticToolbar } from "@webiny/lexical-editor";
import type { EditorTheme } from "@webiny/lexical-theme";
import { createLexicalTokens } from "@webiny/lexical-theme/createLexicalEditorTokens.js";
import { useWebsiteBuilderTheme } from "~/BaseEditor/components/index.js";
import "./wbStaticToolbar.css";
import { CompositionScope } from "@webiny/app-admin";

// Overlay the contentEditable: same origin + same padding as `contentEditableStyles`, and
// neutralize the Placeholder component's default -20px margin. This makes the placeholder's
// first line land exactly on the editor's text start.
const placeholderStyles: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    padding: "8px 12px",
    marginTop: 0,
    // Font size/family come from the paragraph typography class (applied by RichTextEditor);
    // keep the placeholder muted.
    color: "var(--text-color-neutral-muted)"
};

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

const { useAdminConfig } = AdminConfig;

interface LexicalEditorComponentProps extends LexicalEditorProps {
    /**
     * The caller's styles go over the defaults (a form-like editor has its own border and
     * height). Only the scoped editor does it: `.Expanded` and `.Compact` keep their styles.
     */
    stylesOverride?: boolean;
}

const LexicalEditorComponent = ({
    stylesOverride = false,
    ...props
}: LexicalEditorComponentProps) => {
    const { theme } = useWebsiteBuilderTheme();
    const withOverrides = (base: React.CSSProperties, given?: React.CSSProperties) => {
        return stylesOverride ? { ...base, ...given } : base;
    };
    const { lexicalTheme } = useAdminConfig();

    const editorTheme: EditorTheme = {
        colors: theme?.colors ?? [],
        typography: theme?.typography ?? {},
        fontSizes: theme?.fontSizes ?? [],
        tokens: lexicalTokens,
        allowCustomColors: theme?.allowCustomColors ?? lexicalTheme.allowCustomColors
    };

    return (
        <BaseLexicalEditor
            {...props}
            // Without a toolbar container in config (the scope's config isn't registered), the
            // static band shows the admin's global toolbar.
            staticToolbar={<StaticToolbar className={"wb-static-toolbar"} />}
            tag={"p"}
            placeholder={props?.placeholder || "Enter your text here..."}
            placeholderStyles={withOverrides(placeholderStyles, props.placeholderStyles)}
            contentEditableStyles={withOverrides(
                contentEditableStyles,
                props.contentEditableStyles
            )}
            styles={withOverrides(styles, props.styles)}
            theme={editorTheme}
        />
    );
};

export interface ScopedLexicalEditorProps extends LexicalEditorProps {
    /** The config scope it reads, as registered with `<LexicalEditorConfig.Scope name={...}>`. */
    scope: string;
}

/**
 * The website builder's editor, with the config of a scope: its toolbar contents and container.
 * The page's theme comes from `ThemeProvider`.
 */
const ScopedLexicalEditor = ({ scope, ...props }: ScopedLexicalEditorProps) => {
    return (
        <CompositionScope name={scope}>
            <LexicalEditorComponent {...props} stylesOverride />
        </CompositionScope>
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

export const LexicalEditor = Object.assign(ScopedLexicalEditor, {
    Expanded: ExpandedLexicalEditor,
    Compact: CompactLexicalEditor
});
