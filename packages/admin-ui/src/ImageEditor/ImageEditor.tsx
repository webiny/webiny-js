import React, { useEffect, useState } from "react";
import { ReactComponent as ArrowDropDownIcon } from "@webiny/icons/arrow_drop_down.svg";
import { Dialog } from "~/Dialog/index.js";
import { Button } from "~/Button/index.js";
import { DropdownMenu } from "~/DropdownMenu/index.js";
import { CropHotspotEditor, FREE, inferAspectId } from "./CropHotspotEditor.js";
import { AspectRatioPreview } from "./AspectRatioPreview.js";
import { MetaFields } from "./MetaFields.js";
import { SectionLabel } from "./SectionLabel.js";
import {
    DEFAULT_ASPECT_RATIOS,
    DEFAULT_PREVIEW_RATIO_IDS,
    type ImageEditorAspectRatio,
    type ImageEditorCrop,
    type ImageEditorHotspot,
    type ImageEditorImage,
    type ImageEditorValue
} from "./types.js";

export interface ImageEditorProps {
    open: boolean;
    onClose: () => void;
    /** The source image to edit. */
    image: ImageEditorImage;
    /** The current edit (crop/hotspot/alt/caption), if any. */
    value?: ImageEditorValue;
    /** Called with the new edit when the user saves. */
    onSave: (value: ImageEditorValue) => void;
    /** Preview ratios shown in the strip. Defaults to square / 4:3 / 16:9. */
    aspectRatios?: ImageEditorAspectRatio[];
    showAlt?: boolean;
    showCaption?: boolean;
    title?: React.ReactNode;
}

const isFullCrop = (crop: ImageEditorCrop | undefined): boolean => {
    if (!crop) {
        return true;
    }
    return crop.top === 0 && crop.left === 0 && crop.bottom === 0 && crop.right === 0;
};

const isCenteredHotspot = (hotspot: ImageEditorHotspot | undefined): boolean => {
    return !hotspot || (hotspot.x === 0.5 && hotspot.y === 0.5);
};

export const ImageEditor = ({
    open,
    onClose,
    image,
    value,
    onSave,
    aspectRatios = DEFAULT_ASPECT_RATIOS,
    showAlt = true,
    showCaption = true,
    title = "Edit image"
}: ImageEditorProps) => {
    const [crop, setCrop] = useState<ImageEditorCrop | undefined>(value?.crop);
    const [hotspot, setHotspot] = useState<ImageEditorHotspot | undefined>(value?.hotspot);
    const [alt, setAlt] = useState(value?.alt ?? "");
    const [caption, setCaption] = useState(value?.caption ?? "");
    // Selected crop shape. Inferred from the saved crop on open so the selector
    // reflects the shape the crop was made with (rather than always "free").
    const [aspectId, setAspectId] = useState<string>(FREE);
    const [selectedRatioIds, setSelectedRatioIds] = useState<string[]>(() => {
        const defaults = aspectRatios
            .filter(ar => DEFAULT_PREVIEW_RATIO_IDS.includes(ar.id))
            .map(ar => ar.id);
        return defaults.length > 0 ? defaults : aspectRatios.map(ar => ar.id);
    });

    const toggleRatio = (id: string) =>
        setSelectedRatioIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );

    const visibleRatios = aspectRatios.filter(ar => selectedRatioIds.includes(ar.id));

    // Fall back to the image's natural dimensions when the caller didn't provide
    // them (e.g. missing metadata). Without real dimensions the canvas and previews
    // would assume a square and distort the image / mis-map the crop coordinates.
    const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

    useEffect(() => {
        if (!open || !image.src || (image.width > 0 && image.height > 0)) {
            return;
        }
        if (typeof document === "undefined") {
            return;
        }
        const probe = document.createElement("img");
        probe.onload = () => {
            return setNaturalSize({ width: probe.naturalWidth, height: probe.naturalHeight });
        };
        probe.src = image.src;
        return () => {
            probe.onload = null;
        };
    }, [open, image.src, image.width, image.height]);

    const effectiveImage: ImageEditorImage = {
        src: image.src,
        width: image.width > 0 ? image.width : (naturalSize?.width ?? 0),
        height: image.height > 0 ? image.height : (naturalSize?.height ?? 0)
    };

    // Re-seed local state whenever the dialog is (re)opened for a given value.
    useEffect(() => {
        if (open) {
            setCrop(value?.crop);
            setHotspot(value?.hotspot);
            setAlt(value?.alt ?? "");
            setCaption(value?.caption ?? "");
        }
    }, [open, value]);

    // Recover the crop shape from the saved crop on open (and once the intrinsic
    // dimensions resolve). Keyed on `value`, not the live `crop`, so it never snaps
    // the selector while the user is dragging a free-form crop.
    useEffect(() => {
        if (open) {
            setAspectId(inferAspectId(value?.crop, effectiveImage.width, effectiveImage.height));
        }
    }, [open, value, effectiveImage.width, effectiveImage.height]);

    const handleSave = () => {
        const next: ImageEditorValue = {};
        if (!isFullCrop(crop)) {
            next.crop = crop;
        }
        if (!isCenteredHotspot(hotspot)) {
            next.hotspot = hotspot;
        }
        if (showAlt && alt.trim()) {
            next.alt = alt.trim();
        }
        if (showCaption && caption.trim()) {
            next.caption = caption.trim();
        }
        onSave(next);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={title}
            size={"lg"}
            actions={
                <div className={"flex w-full items-center justify-end gap-sm"}>
                    <Button variant={"secondary"} text={"Cancel"} onClick={onClose} />
                    <Button variant={"primary"} text={"Save"} onClick={handleSave} />
                </div>
            }
        >
            <div className={"flex flex-col gap-lg"}>
                <CropHotspotEditor
                    image={effectiveImage}
                    crop={crop}
                    hotspot={hotspot}
                    aspectId={aspectId}
                    onChangeAspect={setAspectId}
                    onChangeCrop={setCrop}
                    onChangeHotspot={setHotspot}
                />

                <div className={"flex flex-col gap-sm"}>
                    <div className={"flex items-center justify-between"}>
                        <SectionLabel>Preview</SectionLabel>
                        <DropdownMenu
                            trigger={
                                <Button
                                    variant={"secondary"}
                                    text={`Preview at (${visibleRatios.length})`}
                                    icon={<ArrowDropDownIcon />}
                                    iconPosition={"end"}
                                />
                            }
                        >
                            {aspectRatios.map(ar => (
                                <DropdownMenu.CheckboxItem
                                    key={ar.id}
                                    text={ar.label}
                                    checked={selectedRatioIds.includes(ar.id)}
                                    onCheckedChange={() => toggleRatio(ar.id)}
                                    onSelect={e => e.preventDefault()}
                                />
                            ))}
                        </DropdownMenu>
                    </div>
                    {visibleRatios.length > 0 ? (
                        <div className={"flex flex-wrap items-start gap-md"}>
                            {visibleRatios.map(ar => (
                                <AspectRatioPreview
                                    key={ar.id}
                                    src={effectiveImage.src}
                                    imageWidth={effectiveImage.width}
                                    imageHeight={effectiveImage.height}
                                    crop={crop}
                                    hotspot={hotspot}
                                    aspectRatio={ar}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className={"text-sm text-neutral-strong"}>
                            Select at least one shape to preview.
                        </div>
                    )}
                </div>

                {showAlt || showCaption ? (
                    <div className={"flex flex-col gap-sm"}>
                        <SectionLabel>Details</SectionLabel>
                        <MetaFields
                            alt={alt}
                            caption={caption}
                            showAlt={showAlt}
                            showCaption={showCaption}
                            onChangeAlt={setAlt}
                            onChangeCaption={setCaption}
                        />
                    </div>
                ) : null}
            </div>
        </Dialog>
    );
};
