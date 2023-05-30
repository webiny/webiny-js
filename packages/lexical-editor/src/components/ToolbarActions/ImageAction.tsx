import React, { useEffect, useState } from "react";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FileManagerFileItem, fileToImagePayload } from "~/utils/files";
import { ImagePayload, INSERT_IMAGE_COMMAND } from "~/commands/insertFiles";
import { LexicalCommand } from "lexical";

const IMAGE_ACTION_TYPE = "image-action";

export const ImageAction = () => {
    const [editor] = useLexicalComposerContext();
    const { actionPlugins } = useRichTextEditor();
    const [imageActionPlugin, setImageActionPlugin] = useState<
        { type: string; plugin: Record<string, any> | Function } | undefined
    >();

    useEffect(() => {
        if (!!actionPlugins?.length) {
            const actionPlugin = actionPlugins.find(action => action.type === IMAGE_ACTION_TYPE);
            setImageActionPlugin(actionPlugin);
        }
    }, [actionPlugins]);

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
