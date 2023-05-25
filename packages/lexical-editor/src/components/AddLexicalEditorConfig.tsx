import React, {FC} from "react";
import {createComponentPlugin} from "@webiny/react-composition";
import { EditorConfiguration } from "~/components/LexicalEditorConfig/LexicalEditorConfig";


interface AddLexicalEditorConfig {
    scope: string
}
export const AddLexicalEditorConfig: FC<AddLexicalEditorConfig> = ({
                                                                      scope: targetScope
                                                                  }) =>
{
const EditorConfigurationPlugin = React.memo(
    createComponentPlugin(EditorConfiguration, Original => {
        return function LexicalEditorConfig({ scope, children }): JSX.Element | null {
            if(targetScope === scope) {
                return (
                    <Original scope={scope}>
                        {children}
                    </Original>
                );
            }
            return null;
        };
    })
);
    return <EditorConfigurationPlugin />;
}
