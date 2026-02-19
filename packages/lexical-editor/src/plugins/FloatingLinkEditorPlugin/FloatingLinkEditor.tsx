import React from "react";
import type { LexicalEditor } from "lexical";
import { LinkFormProps } from "./types.js";
import { useFloatingLinkEditor } from "./useFloatingLinkEditor.js";

interface FloatingLinkEditorProps {
    editor: LexicalEditor;
    isVisible: boolean;
    LinkForm: React.FunctionComponent<LinkFormProps>;
}

export function FloatingLinkEditor({ editor, isVisible, LinkForm }: FloatingLinkEditorProps) {
    const { editorRef, linkData, applyChanges, removeLink } = useFloatingLinkEditor(editor);

    return (
        <div
            ref={editorRef}
            className="z-dialog absolute link-editor"
            style={{ opacity: isVisible ? 1 : 0, pointerEvents: isVisible ? "auto" : "none" }}
        >
            {isVisible ? (
                <LinkForm linkData={linkData} onSave={applyChanges} removeLink={removeLink} />
            ) : null}
        </div>
    );
}
