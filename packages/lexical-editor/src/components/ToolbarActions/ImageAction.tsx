import React, { useEffect, useState } from "react";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FileManagerFileItem, fileToImagePayload } from "~/utils/files";
import { ImagePayload, INSERT_IMAGE_COMMAND } from "~/commands/insertFiles";
import { LexicalCommand } from "lexical";
import { ToolbarActionPlugin } from "~/types";

export const ImageAction = () => {
    const [editor] = useLexicalComposerContext();
    const { toolbarActionPlugins } = useRichTextEditor();
    const [imageActionPlugin, setImageActionPlugin] = useState<ToolbarActionPlugin | undefined>();

    useEffect(() => {
        if (!!toolbarActionPlugins?.length) {
            const actionPlugin = toolbarActionPlugins.find(
                action => action.targetAction === "image-action"
            );
            setImageActionPlugin(actionPlugin);
        }
    }, [toolbarActionPlugins]);

    const handleClick = () => {
        if (typeof imageActionPlugin?.plugin === "function") {
            imageActionPlugin?.plugin((data: FileManagerFileItem) => {
                const imagePayload = fileToImagePayload(data);
                if (imagePayload) {
                    editor.dispatchCommand<LexicalCommand<ImagePayload>>(
                        INSERT_IMAGE_COMMAND,
                        imagePayload
                    );
                }
            });
        }
    };

    return (
        <button onClick={() => handleClick()} className={"popup-item"} aria-label="Insert image">
            <i className="icon insert-image" />
        </button>
    );
};
