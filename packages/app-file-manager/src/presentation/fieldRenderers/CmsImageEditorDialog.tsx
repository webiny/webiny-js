import React from "react";
import { ImageEditor, type ImageEditorValue } from "@webiny/admin-ui";
import type { useCmsImageEditor } from "~/presentation/hooks/useCmsImageEditor.js";

interface CmsImageEditorDialogProps {
    editor: ReturnType<typeof useCmsImageEditor>;
}

export const CmsImageEditorDialog = ({ editor }: CmsImageEditorDialogProps) => {
    const { open, close, file, save } = editor;

    if (!file) {
        return null;
    }

    const img = file.metadata?.image as Record<string, any> | undefined;
    const value: ImageEditorValue | undefined =
        img?.crop || img?.focalPoint
            ? {
                  crop: img.crop ?? undefined,
                  hotspot: img.focalPoint
                      ? { x: img.focalPoint.x, y: img.focalPoint.y, width: 1, height: 1 }
                      : undefined,
                  alt: img.alt ?? undefined,
                  caption: img.caption ?? undefined
              }
            : undefined;

    return (
        <ImageEditor
            open={open}
            onClose={close}
            image={{
                src: file.src,
                width: img?.width ?? 0,
                height: img?.height ?? 0
            }}
            value={value}
            onSave={save}
        />
    );
};
