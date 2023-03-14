import React from "react";
import { FontColorAction } from "~/components/ToolbarActions/FontColorAction";

interface LexicalEditorConfig extends React.FC<unknown> {
    FontColorAction: typeof FontColorAction;
}

export const LexicalEditorConfig: LexicalEditorConfig = ({ children }) => {
    return <>{children}</>;
};

LexicalEditorConfig.FontColorAction = FontColorAction;
