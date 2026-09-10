import React, { useState } from "react";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { FileManager } from "@webiny/app-admin/base/ui/FileManager.js";
import type { FileManagerFileItem } from "@webiny/app-admin/base/ui/FileManager.js";
import { FilePicker, RichItemPreview, ImageEditor, type ImageEditorValue } from "@webiny/admin-ui";
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

export interface AssetFieldRendererSettings extends Record<string, unknown> {
    imagesOnly?: boolean;
    accept?: string[];
}

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        cmsAssetPicker: { fieldType: "asset"; settings: AssetFieldRendererSettings };
    }
}

/**
 * Single-asset picker for the CMS Asset field. The field value is the typed Asset
 * object; the picker chrome shows the file's URL, while crop / focal point / alt
 * are edited per-usage via the shared `ImageEditor` and written back onto
 * `value.image`.
 */
export const CmsAssetPickerRenderer = createFieldRenderer<"cmsAssetPicker">(({ field }) => {
    const settings = field.rendererSettings as AssetFieldRendererSettings | undefined;
    const value = (field.value as Asset | null) ?? null;
    const [editing, setEditing] = useState(false);

    const src = value?.src ?? undefined;
    const editable = isImageAsset(value) && hasAsset(value);
    const showCroppedPreview = editable && hasImageEdit(value?.image);

    return (
        <FileManager
            images={settings?.imagesOnly}
            accept={settings?.accept}
            render={({ showFileManager }) => (
                <>
                    <FilePicker
                        label={field.label}
                        description={field.description}
                        note={field.note}
                        hint={field.help}
                        type="compact"
                        value={src}
                        validation={field.validation}
                        // Reflect the per-usage crop + focal point in the thumbnail.
                        renderFilePreview={
                            showCroppedPreview && value?.src && value.image
                                ? previewProps => (
                                      <RichItemPreview
                                          {...previewProps}
                                          renderImage={({ name }) => (
                                              <CroppedAssetThumb
                                                  src={value.src as string}
                                                  name={name}
                                                  image={value.image!}
                                              />
                                          )}
                                      />
                                  )
                                : undefined
                        }
                        onSelectItem={() =>
                            showFileManager((file: FileManagerFileItem) => {
                                field.onChange(fileItemToAsset(file));
                            })
                        }
                        onRemoveItem={() => field.onChange(null)}
                        onEditItem={editable ? () => setEditing(true) : undefined}
                    />
                    {editable && value ? (
                        <ImageEditor
                            open={editing}
                            onClose={() => setEditing(false)}
                            image={{
                                src: value.src ?? "",
                                width: value.image?.width ?? 0,
                                height: value.image?.height ?? 0
                            }}
                            value={assetImageToEditorValue(value.image)}
                            onSave={(edit: ImageEditorValue) => {
                                field.onChange(applyImageEditToAsset(value, edit));
                                setEditing(false);
                            }}
                        />
                    ) : null}
                </>
            )}
        />
    );
});
