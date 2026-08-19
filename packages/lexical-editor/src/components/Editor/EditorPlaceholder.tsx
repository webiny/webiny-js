import React, { useEffect, useState } from "react";
import type { LexicalNode } from "lexical";
import { $getRoot } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isRootTextContentEmpty } from "@lexical/text";
import { Placeholder } from "~/ui/Placeholder.js";
import { useRichTextEditor } from "~/hooks/index.js";

interface EditorPlaceholderProps {
    text: React.ReactNode;
    styles?: React.CSSProperties;
    fallbackClassName?: string;
}

interface WithStyleId {
    getStyleId(): string | undefined;
}

const hasStyleId = (node: LexicalNode | null): node is LexicalNode & WithStyleId => {
    return !!node && typeof (node as Partial<WithStyleId>).getStyleId === "function";
};

/**
 * Renders our own placeholder, shown whenever the editor's text content is empty —
 * regardless of the current block type. Lexical's built-in placeholder only shows for an
 * empty paragraph, so it disappears when the block is a heading, quote, etc. The placeholder
 * also picks up the current block's typography (via its style id), falling back to the
 * default paragraph style, so its size/font matches whatever the user is about to type.
 */
export const EditorPlaceholder = ({ text, styles, fallbackClassName }: EditorPlaceholderProps) => {
    const [editor] = useLexicalComposerContext();
    const { theme } = useRichTextEditor();
    const [state, setState] = useState<{ isEmpty: boolean; className?: string }>({
        isEmpty: true
    });

    useEffect(() => {
        const update = () => {
            editor.getEditorState().read(() => {
                const isEmpty = $isRootTextContentEmpty(editor.isComposing());
                const firstBlock = $getRoot().getFirstChild();
                const styleId = hasStyleId(firstBlock) ? firstBlock.getStyleId() : undefined;
                const className = styleId ? theme.getTypographyById(styleId)?.className : undefined;
                setState({ isEmpty, className });
            });
        };
        update();
        return editor.registerUpdateListener(update);
    }, [editor, theme]);

    if (!state.isEmpty) {
        return null;
    }

    return (
        <Placeholder styles={styles} className={state.className ?? fallbackClassName}>
            {text}
        </Placeholder>
    );
};
