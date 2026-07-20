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

/**
 * Reads/writes the asset-level image edit (crop, hotspot, alt, caption) stored on
 * `file.metadata.imageEdit`, and manages the editor dialog's open state.
 */
export function useEditImage(file: FileItem, options: UseEditImageOptions = {}) {
    const { showSnackbar } = useSnackbar();
    const container = useContainer();
    const updateFileUseCase = container.resolve(UpdateFileUseCase);
    const { onSaved } = options;

    const [open, setOpen] = useState(false);

    const value = (file.metadata?.imageEdit as ImageEditorValue | undefined) ?? undefined;

    const openEditor = useCallback(() => setOpen(true), []);
    const closeEditor = useCallback(() => setOpen(false), []);

    const save = useCallback(
        async (edit: ImageEditorValue) => {
            // Preserve the rest of the metadata bag (image dimensions, exif, ...).
            const metadata: Record<string, any> = { ...file.metadata };
            if (Object.keys(edit).length > 0) {
                metadata.imageEdit = edit;
            } else {
                delete metadata.imageEdit;
            }

            const result = await updateFileUseCase.execute({ id: file.id, data: { metadata } });

            if (result.success) {
                showSnackbar(`Image settings saved.`);
                // Surface the updated file so the drawer/list previews refresh in place.
                onSaved?.(result.file);
            } else {
                showSnackbar(result.error.message);
            }
        },
        [file.id, file.metadata, updateFileUseCase, showSnackbar, onSaved]
    );

    return { open, openEditor, closeEditor, value, save };
}
