import React from "react";
import { FontColorAction } from "~/components/ToolbarActions/FontColorAction";
import { TypographyAction } from "~/components/ToolbarActions/TypographyAction";
import { TextAlignmentAction } from "../ToolbarActions/TextAlignmentAction";

interface LexicalEditorConfig extends React.FC<unknown> {
    FontColorAction: typeof FontColorAction;
    TypographyAction: typeof TypographyAction;
    TextAlignmentAction: typeof TextAlignmentAction;

}

export const LexicalEditorConfig: LexicalEditorConfig = ({ children }) => {
    return <>{children}</>;
};

LexicalEditorConfig.FontColorAction = FontColorAction;
LexicalEditorConfig.TypographyAction = TypographyAction;
LexicalEditorConfig.TextAlignmentAction = TextAlignmentAction;
