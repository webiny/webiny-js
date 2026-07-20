import React from "react";
import { ImageEditor, type ImageEditorValue } from "@webiny/admin-ui";
import type { useCmsImageEditor } from "~/presentation/hooks/useCmsImageEditor.js";

interface CmsImageEditorDialogProps {
    editor: ReturnType<typeof useCmsImageEditor>;
}

/**
 * Renders the shared image editor for a CMS file field once a file has been
 * resolved (see `useCmsImageEditor`). Edits the File's asset-level crop/hotspot/alt.
 */
export const CmsImageEditorDialog = ({ editor }: CmsImageEditorDialogProps) => {
    const { open, close, file, save } = editor;

    if (!file) {
        return null;
    }

    return (
        <ImageEditor
            open={open}
            onClose={close}
            image={{
                src: file.src,
                width: file.metadata?.image?.width ?? 0,
                height: file.metadata?.image?.height ?? 0
            }}
            value={file.metadata?.imageEdit as ImageEditorValue | undefined}
            onSave={save}
        />
    );
};
