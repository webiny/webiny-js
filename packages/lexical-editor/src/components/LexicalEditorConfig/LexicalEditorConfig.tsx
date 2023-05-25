import React from "react";
import { FontColorAction } from "~/components/ToolbarActions/FontColorAction";
import { TypographyAction } from "~/components/ToolbarActions/TypographyAction";
import { makeComposable } from "@webiny/react-composition";
import { EditorConfigProvider } from "~/context/EditorConfigContext";

interface LexicalEditorConfig extends React.FC<unknown> {
    FontColorAction: typeof FontColorAction;
    TypographyAction: typeof TypographyAction;
}

export const LexicalEditorConfig: LexicalEditorConfig = ({ children }) => {
    return <>{children}</>;
};

LexicalEditorConfig.FontColorAction = FontColorAction;
LexicalEditorConfig.TypographyAction = TypographyAction;

interface EditorConfigurationProps {
    scope: string;
}

export const EditorConfiguration = makeComposable<EditorConfigurationProps>(
    "EditorConfiguration",
    ({ scope,children }): JSX.Element | null => {
        return (
            <EditorConfigProvider scope={scope}>
             <>{children}</>;
            </EditorConfigProvider>
        )
    }
);



