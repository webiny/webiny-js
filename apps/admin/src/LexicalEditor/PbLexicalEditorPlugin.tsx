import React from "react";

import { LexicalEditorConfig } from "@webiny/app-page-builder";

export const LexicalHeadingEditor = () => {
    return (
        <>
            <LexicalEditorConfig.Heading.ToolbarAction
                name={"fontColor"}
                element={<button>PB</button>}
            />
            <LexicalEditorConfig.Heading.ToolbarAction name={"typography"} remove />
            <LexicalEditorConfig.Heading.ToolbarAction
                name={"myToolbarAction"}
                after={"fontColor"}
                element={<button>MTA</button>}
            />
            <LexicalEditorConfig.Heading.ToolbarAction
                name={"bold"}
                after={"italic"}
                element={<button>B</button>}
            />
        </>
    );
};

export const LexicalParagraphEditor = () => {
    return (
        <>
            <LexicalEditorConfig.Paragraph.ToolbarAction
                name={"fontColor"}
                element={<button>PB</button>}
            />
            <LexicalEditorConfig.Paragraph.ToolbarAction name={"typography"} remove />
            <LexicalEditorConfig.Paragraph.ToolbarAction
                name={"myToolbarAction"}
                after={"fontColor"}
                element={<button>MTA</button>}
            />
            <LexicalEditorConfig.Paragraph.ToolbarAction
                name={"bold"}
                after={"italic"}
                element={<button>B</button>}
            />
            <LexicalEditorConfig.Paragraph.Plugin name={"quote"} remove />
        </>
    );
};

export const PbLexicalEditorPlugin = () => {
    return (
        <>
            <LexicalParagraphEditor />
            <LexicalHeadingEditor />
        </>
    );
};
