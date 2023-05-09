import React, { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_NORMAL, PASTE_COMMAND } from "lexical";

export const PasteContentPlugin: React.FC = () => {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand<ClipboardEvent>(
            PASTE_COMMAND,
            event => {
                const { clipboardData } = event;
                const allData: string[] = [];
                if (clipboardData && clipboardData.types) {
                    console.clear();
                    clipboardData.types.forEach(type => {
                        allData.push(type.toUpperCase(), clipboardData.getData(type));
                        console.log(`Type: ${type}, data: `, clipboardData.getData(type));
                    });
                }
                return false;
            },
            COMMAND_PRIORITY_NORMAL
        );
    }, [editor]);

    return null;
};
