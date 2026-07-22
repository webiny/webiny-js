import React, { useState } from "react";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { FileManager } from "@webiny/app-admin/base/ui/FileManager.js";
import type { FileManagerFileItem } from "@webiny/app-admin/base/ui/FileManager.js";
import {
    MultiFilePicker,
    RichItemPreview,
    ImageEditor,
    type ImageEditorValue
} from "@webiny/admin-ui";
import type { AssetFieldRendererSettings } from "./CmsAssetPickerRenderer.js";
import {
    applyImageEditToAsset,
    assetImageToEditorValue,
    fileItemToAsset,
    hasAsset,
    hasImageEdit,
    isImageAsset,
    type Asset
} from "./assetValue.js";
import { CroppedAssetThumb } from "./CroppedAssetThumb.js";

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        cmsMultiAssetPicker: { fieldType: "asset"; settings: AssetFieldRendererSettings };
    }
}

/**
 * Multi-asset picker for a list-mode CMS Asset field. The value is an array of
 * typed Asset objects; the picker shows each file's URL and offers a per-item
 * crop / focal point / alt editor that writes back onto that item's `image`.
 */
export const CmsMultiAssetPickerRenderer = createFieldRenderer<"cmsMultiAssetPicker">(
    ({ field }) => {
        const settings = field.rendererSettings as AssetFieldRendererSettings | undefined;
        const value = field.value as Asset[] | null | undefined;
        const assets = Array.isArray(value) ? value : [];
        const [editingIndex, setEditingIndex] = useState<number | null>(null);

        const editingAsset = editingIndex !== null ? assets[editingIndex] : undefined;
        const editable = isImageAsset(editingAsset) && hasAsset(editingAsset);

        const replaceAt = (index: number, next: Asset[]) => {
            field.onChange([...assets.slice(0, index), ...next, ...assets.slice(index + 1)]);
        };

        return (
            <FileManager
                multiple
                images={settings?.imagesOnly}
                accept={settings?.accept}
                render={({ showFileManager }) => {
                    const selectFiles = (replaceIndex = -1) => {
                        showFileManager((files: FileManagerFileItem[]) => {
                            const picked = files.map(fileItemToAsset);
                            if (replaceIndex === -1) {
                                field.onChange([...assets, ...picked]);
                            } else {
                                replaceAt(replaceIndex, picked);
                            }
                        });
                    };

                    return (
                        <>
                            <MultiFilePicker
                                label={field.label}
                                description={field.description}
                                note={field.note}
                                hint={field.help}
                                type="compact"
                                values={assets.map(a => a.src ?? "")}
                                // Reflect each item's per-usage crop + focal point.
                                renderFilePreview={previewProps => {
                                    const asset = assets.find(
                                        a => a.src === previewProps.value.url
                                    );
                                    if (asset?.src && hasImageEdit(asset.image)) {
                                        return (
                                            <RichItemPreview
                                                {...previewProps}
                                                renderImage={({ name }) => (
                                                    <CroppedAssetThumb
                                                        src={asset.src as string}
                                                        name={name}
                                                        image={asset.image!}
                                                    />
                                                )}
                                            />
                                        );
                                    }
                                    return <RichItemPreview {...previewProps} />;
                                }}
                                onSelectItem={() => selectFiles()}
                                onReplaceItem={(_, index) => selectFiles(index)}
                                onEditItem={(_, index) => {
                                    const asset = assets[index];
                                    if (isImageAsset(asset) && hasAsset(asset)) {
                                        setEditingIndex(index);
                                    }
                                }}
                                onRemoveItem={(_, index) => {
                                    field.onChange([
                                        ...assets.slice(0, index),
                                        ...assets.slice(index + 1)
                                    ]);
                                }}
                            />
                            {editable && editingAsset ? (
                                <ImageEditor
                                    open={editingIndex !== null}
                                    onClose={() => setEditingIndex(null)}
                                    image={{
                                        src: editingAsset.src ?? "",
                                        width: editingAsset.image?.width ?? 0,
                                        height: editingAsset.image?.height ?? 0
                                    }}
                                    value={assetImageToEditorValue(editingAsset.image)}
                                    onSave={(edit: ImageEditorValue) => {
                                        if (editingIndex !== null) {
                                            replaceAt(editingIndex, [
                                                applyImageEditToAsset(editingAsset, edit)
                                            ]);
                                        }
                                        setEditingIndex(null);
                                    }}
                                />
                            ) : null}
                        </>
                    );
                }}
            />
        );
    }
);
