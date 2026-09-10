import { useCallback, useState } from "react";
import { useSnackbar } from "@webiny/app-admin";
import { useContainer } from "@webiny/app";
import type { ImageEditorValue } from "@webiny/admin-ui";
import { UpdateFileUseCase } from "~/features/updateFile/abstractions.js";
import type { FileItem } from "~/domain/types.js";

interface UseEditImageOptions {
    /** Called with the updated file after a successful save (e.g. to refresh the UI). */
    onSaved?: (file: FileItem) => void;
}

export function useEditImage(file: FileItem, options: UseEditImageOptions = {}) {
    const { showSnackbar } = useSnackbar();
    const container = useContainer();
    const updateFileUseCase = container.resolve(UpdateFileUseCase);
    const { onSaved } = options;

    const [open, setOpen] = useState(false);

    const img = file.metadata?.image as Record<string, any> | undefined;
    const value: ImageEditorValue | undefined = img
        ? {
              crop: img.crop ?? undefined,
              hotspot: img.focalPoint
                  ? { x: img.focalPoint.x, y: img.focalPoint.y, width: 1, height: 1 }
                  : undefined,
              alt: img.alt ?? undefined,
              caption: img.caption ?? undefined
          }
        : undefined;

    const openEditor = useCallback(() => setOpen(true), []);
    const closeEditor = useCallback(() => setOpen(false), []);

    const save = useCallback(
        async (edit: ImageEditorValue) => {
            const metadata: Record<string, any> = { ...file.metadata };
            const image: Record<string, any> = { ...metadata.image };

            image.crop = edit.crop ?? undefined;
            image.focalPoint = edit.hotspot ? { x: edit.hotspot.x, y: edit.hotspot.y } : undefined;
            image.alt = edit.alt ?? undefined;
            image.caption = edit.caption ?? undefined;

            metadata.image = image;

            const result = await updateFileUseCase.execute({ id: file.id, data: { metadata } });

            if (result.success) {
                showSnackbar(`Image settings saved.`);
                onSaved?.(result.file);
            } else {
                showSnackbar(result.error.message);
            }
        },
        [file.id, file.metadata, updateFileUseCase, showSnackbar, onSaved]
    );

    return { open, openEditor, closeEditor, value, save };
}
