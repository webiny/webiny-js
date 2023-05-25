import React, { FC } from "react";
import { createComponentPlugin } from "@webiny/react-composition";
import { StaticToolbar } from "~/components/Toolbar/StaticToolbar";
import {EditorConfiguration} from "~/components/LexicalEditorConfig/LexicalEditorConfig";
interface AddConfigItemProps {
    scope?: string;
    element: JSX.Element;
}

export const AddConfigItem: FC<AddConfigItemProps> = ({
                                                                      element,
                                                                      scope: targetScope
                                                                  }) => {
    const LexicalEditorConfigPlugin = React.memo(
        createComponentPlugin(EditorConfiguration, Original => {
            return function EditorConfiguration({ scope, children }): JSX.Element | null {
                if (targetScope === scope) {
                    return (
                        <Original scope={scope}>
                            {element}
                            {children}
                        </Original>
                    );
                }

                return null;
            };
        })
    );

    return <LexicalEditorConfigPlugin />;
};
