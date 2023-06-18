import React from "react";

import { LexicalEditorConfig } from "@webiny/app-page-builder";

const { Heading, Paragraph } = LexicalEditorConfig;

export const LexicalHeadingEditor = () => {
    return (
        <LexicalEditorConfig>
            <Heading.ToolbarAction name={"fontColor"} element={<button>PB</button>} />
            <Heading.ToolbarAction name={"typography"} remove />
            <Heading.ToolbarAction
                name={"myToolbarAction"}
                after={"fontColor"}
                element={<button>MTA</button>}
            />
            <Heading.ToolbarAction name={"bold"} after={"italic"} element={<button>B</button>} />
        </LexicalEditorConfig>
    );
};

export const LexicalParagraphEditor = () => {
    return (
        <LexicalEditorConfig>
            <Paragraph.ToolbarAction name={"fontColor"} element={<button>PB</button>} />
            <Paragraph.ToolbarAction name={"typography"} remove />
            <Paragraph.ToolbarAction
                name={"myToolbarAction"}
                after={"fontColor"}
                element={<button>MTA</button>}
            />
            <Paragraph.ToolbarAction name={"bold"} after={"italic"} element={<button>B</button>} />
            <Paragraph.Plugin name={"quote"} remove />
        </LexicalEditorConfig>
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
