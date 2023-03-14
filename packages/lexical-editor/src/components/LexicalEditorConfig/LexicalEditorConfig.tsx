import React from "react";
import { FontColorAction } from "~/components/ToolbarActions/FontColorAction";
import { TypographyAction } from "~/components/ToolbarActions/TypographyAction";

interface LexicalEditorConfig extends React.FC<unknown> {
    FontColorAction: typeof FontColorAction;
    TypographyAction: typeof TypographyAction;
}

export const LexicalEditorConfig: LexicalEditorConfig = ({ children }) => {
    return <>{children}</>;
};

LexicalEditorConfig.FontColorAction = FontColorAction;
LexicalEditorConfig.TypographyAction = TypographyAction;
