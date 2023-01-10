import React, { FC } from "react";
import { Klass, LexicalNode } from "lexical";
import { createComponentPlugin } from "@webiny/react-composition";
import { RichTextEditor } from "~/components/Editor/RichTextEditor";

export interface AddRichTextEditorNodeTypeProps {
    type: Klass<LexicalNode>;
}

export const AddRichTextEditorNodeType: FC<AddRichTextEditorNodeTypeProps> = ({ type }) => {
    const NodePlugin = createComponentPlugin(RichTextEditor, Original => {
        return function RichTextEditor({ nodes, children, ...rest }): JSX.Element {
            return (
                <Original {...rest} nodes={[...(nodes || []), type]}>
                    {children}
                </Original>
            );
        };
    });

    return <NodePlugin />;
};
