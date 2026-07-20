import { useCallback, useState } from "react";
import { useSnackbar } from "@webiny/app-admin";
import { useContainer } from "@webiny/app";
import type { ImageEditorValue } from "@webiny/admin-ui";
import { GetFileUseCase } from "~/features/getFile/abstractions.js";
import { UpdateFileUseCase } from "~/features/updateFile/abstractions.js";
import type { FileItem } from "~/domain/types.js";

const IMAGE_URL = /\.(jpe?g|png|webp|avif|gif)$/i;

/** Whether a stored file URL points at a raster image we can crop (SVGs excluded). */
export const isEditableImageUrl = (url: string | undefined): url is string => {
    return !!url && IMAGE_URL.test(url.split("?")[0]);
};

/**
 * Resolve a File's id from its public URL. File keys are `{id}/{filename}` and the
 * URL is `{srcPrefix}{key}`, so the id is the second-to-last path segment (this is
 * the same convention the asset-delivery ObjectKey relies on).
 */
const parseFileId = (url: string): string | undefined => {
    const clean = url.split("?")[0].replace(/\/+$/, "");
    const parts = clean.split("/").filter(Boolean);
    return parts.length >= 2 ? parts[parts.length - 2] : undefined;
};

/**
 * Drives the image editor for a Headless CMS file field, where the field value is
 * only a URL. Resolves the underlying File (to get its dimensions + current edit),
 * and saves the crop/hotspot/alt to the File's asset-level `metadata.imageEdit`.
 */
export function useCmsImageEditor() {
    const { showSnackbar } = useSnackbar();
    const container = useContainer();
    const getFileUseCase = container.resolve(GetFileUseCase);
    const updateFileUseCase = container.resolve(UpdateFileUseCase);

    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<FileItem | null>(null);

    const openFor = useCallback(
        async (url: string) => {
            const id = parseFileId(url);
            if (!id) {
                showSnackbar("Could not resolve the image to edit.");
                return;
            }
            const result = await getFileUseCase.execute({ id });
            if (result.success) {
                setFile(result.file);
                setOpen(true);
            } else {
                showSnackbar(result.error.message);
            }
        },
        [getFileUseCase, showSnackbar]
    );

    const close = useCallback(() => setOpen(false), []);

    const save = useCallback(
        async (edit: ImageEditorValue) => {
            if (!file) {
                return;
            }
            const metadata: Record<string, any> = { ...file.metadata };
            if (Object.keys(edit).length > 0) {
                metadata.imageEdit = edit;
            } else {
                delete metadata.imageEdit;
            }

            const result = await updateFileUseCase.execute({ id: file.id, data: { metadata } });
            if (result.success) {
                showSnackbar("Image settings saved.");
                setFile(result.file);
            } else {
                showSnackbar(result.error.message);
            }
        },
        [file, updateFileUseCase, showSnackbar]
    );

    return { open, openFor, close, file, save };
}
