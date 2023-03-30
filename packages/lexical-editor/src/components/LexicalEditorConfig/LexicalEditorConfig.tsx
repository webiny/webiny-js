import React from "react";
import { FontColorAction } from "~/components/ToolbarActions/FontColorAction";

interface LexicalEditorConfig extends React.VFC<{ children: React.ReactNode }> {
    FontColorAction: typeof FontColorAction;
}

export const LexicalEditorConfig: LexicalEditorConfig = ({ children }) => {
    return <>{children}</>;
};

LexicalEditorConfig.FontColorAction = FontColorAction;
