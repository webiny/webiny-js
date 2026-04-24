import React from "react";
import { LexicalEditor as BaseLexicalEditor } from "@webiny/app-admin";
import { StaticToolbar } from "@webiny/lexical-editor";
import type { EditorTheme } from "@webiny/lexical-theme";
import { createLexicalTokens } from "@webiny/lexical-theme/createLexicalEditorTokens.js";
import { useWebsiteBuilderTheme } from "~/BaseEditor/components/index.js";
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

const lexicalTokens = createLexicalTokens("wb-lx-");

export type LexicalEditorProps = Omit<React.ComponentProps<typeof BaseLexicalEditor>, "theme">;

export const LexicalEditor = (props: LexicalEditorProps) => {
    const { theme } = useWebsiteBuilderTheme();

    const editorTheme: EditorTheme = {
        colors: theme?.colors ?? [],
        typography: theme?.typography ?? {},
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
