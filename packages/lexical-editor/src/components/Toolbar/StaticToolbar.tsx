import React, { Fragment } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import "./StaticToolbar.css";
import { useLexicalEditorConfig } from "~/components/LexicalEditorConfig/LexicalEditorConfig";

export const StaticToolbar = () => {
    const [editor] = useLexicalComposerContext();
    const { toolbarElements } = useLexicalEditorConfig();

    return (
        <div className="static-toolbar">
            {editor.isEditable() && (
                <>
                    {toolbarElements.map(action => (
                        <Fragment key={action.name}>{action.element}</Fragment>
                    ))}
                </>
            )}
        </div>
    );
};
