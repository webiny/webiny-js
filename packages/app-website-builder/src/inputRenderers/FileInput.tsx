import React, { useState } from "react";
import {
    FilePicker,
    ImageEditor,
    RichItemPreview,
    getCroppedImageRenderStyles,
    type ImageEditorValue
} from "@webiny/admin-ui";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";
import { FileManager, type FileManagerFileItem } from "@webiny/app-admin";
import { useBreakpoint } from "~/BaseEditor/hooks/useBreakpoint.js";
import {
    assetImageFromLegacyEdit,
    normalizeToAsset,
    type WebinyAsset,
    type WebinyAssetImage
} from "@webiny/website-builder-sdk";
import type { FileInput } from "@webiny/website-builder-sdk";
import { fileManagerItemToValue } from "~/shared/fileManagerItemToValue.js";

const isEditableImage = (asset: WebinyAsset | undefined): asset is WebinyAsset => {
    return (
        !!asset?.src &&
        typeof asset.type === "string" &&
        asset.type.startsWith("image/") &&
        asset.type !== "image/svg+xml"
    );
};

/** True when the image carries a non-trivial crop or focal point worth previewing. */
const hasImageEdit = (image: WebinyAssetImage | undefined): boolean => {
    if (!image?.width || !image?.height) {
        return false;
    }
    const c = image.crop;
    const fullCrop = !c || (c.top === 0 && c.left === 0 && c.bottom === 0 && c.right === 0);
    const fp = image.focalPoint;
    const centeredFocal = !fp || (fp.x === 0.5 && fp.y === 0.5);
    return !fullCrop || !centeredFocal;
};

/** Map the stored asset image into the shared `ImageEditor` value (focalPoint → hotspot). */
const toEditorValue = (image: WebinyAssetImage | undefined): ImageEditorValue | undefined => {
    if (!image) {
        return undefined;
    }
    return {
        crop: image.crop,
        hotspot: image.focalPoint
            ? { x: image.focalPoint.x, y: image.focalPoint.y, width: 1, height: 1 }
            : undefined,
        alt: image.alt,
        caption: image.caption
    };
};

export const FileInputRenderer = ({
    value,
    onChange,
    label,
    ...props
}: ElementInputRendererProps) => {
    const input = props.input as FileInput;
    const { isBaseBreakpoint } = useBreakpoint();
    const [editorOpen, setEditorOpen] = useState(false);

    // Normalize the current value: this transparently upgrades legacy page values
    // (`WebinyImageValue`) to the unified asset shape for display/editing.
    const asset = normalizeToAsset(value) ?? undefined;
    const editable = isEditableImage(asset);

    const onFileChange = (file: FileManagerFileItem) => {
        onChange(({ value }) => {
            value.set(fileManagerItemToValue(file));
        });
    };

    const onRemove = () => {
        onChange(({ value }) => {
            if (isBaseBreakpoint) {
                value.set(undefined);
            } else {
                value.set(null);
            }
        });
    };

    // Save the per-usage crop / focal point / alt override onto the element value,
    // writing the unified asset shape (hotspot → focalPoint).
    const onSaveEdit = (edit: ImageEditorValue) => {
        onChange(({ value }) => {
            if (!asset) {
                return;
            }
            const image = assetImageFromLegacyEdit(edit, {
                width: asset.image?.width,
                height: asset.image?.height
            });
            value.set({ ...asset, image });
        });
    };

    return (
        <FileManager
            accept={input.allowedFileTypes}
            onChange={onFileChange}
            render={({ showFileManager }) => (
                <>
                    <FilePicker
                        variant={"secondary"}
                        label={label}
                        description={input.description}
                        type="compact"
                        value={asset?.src}
                        // Reflect the per-usage crop + focal point in the thumbnail.
                        renderFilePreview={
                            editable && asset?.src && hasImageEdit(asset.image)
                                ? previewProps => (
                                      <RichItemPreview
                                          {...previewProps}
                                          renderImage={({ name }) => {
                                              const { wrapper, image } =
                                                  getCroppedImageRenderStyles(
                                                      asset.image?.width ?? 0,
                                                      asset.image?.height ?? 0,
                                                      asset.image?.crop,
                                                      asset.image?.focalPoint
                                                          ? {
                                                                x: asset.image.focalPoint.x,
                                                                y: asset.image.focalPoint.y,
                                                                width: 1,
                                                                height: 1
                                                            }
                                                          : undefined,
                                                      { boxWidth: 1, boxHeight: 1, fit: "cover" }
                                                  );
                                              return (
                                                  <div style={wrapper}>
                                                      <img
                                                          src={asset.src as string}
                                                          alt={name}
                                                          draggable={false}
                                                          style={image}
                                                      />
                                                  </div>
                                              );
                                          }}
                                      />
                                  )
                                : undefined
                        }
                        onSelectItem={() => showFileManager()}
                        onRemoveItem={onRemove}
                        // The "Edit" (pencil) action edits the image (crop / focal
                        // point / alt). Replacing the file is done by clicking the
                        // preview. For non-images there is nothing to edit, so the
                        // pencil is hidden.
                        onEditItem={editable ? () => setEditorOpen(true) : undefined}
                    />
                    {editable ? (
                        <ImageEditor
                            open={editorOpen}
                            onClose={() => setEditorOpen(false)}
                            image={{
                                src: asset.src,
                                width: asset.image?.width ?? 0,
                                height: asset.image?.height ?? 0
                            }}
                            value={toEditorValue(asset.image)}
                            onSave={onSaveEdit}
                        />
                    ) : null}
                </>
            )}
        />
    );
};
