import React from "react";
import { getPreviewStyles } from "./geometry.js";
import type { ImageEditorAspectRatio, ImageEditorCrop, ImageEditorHotspot } from "./types.js";

interface AspectRatioPreviewProps {
    src: string;
    imageWidth: number;
    imageHeight: number;
    crop: ImageEditorCrop | undefined;
    hotspot: ImageEditorHotspot | undefined;
    aspectRatio: ImageEditorAspectRatio;
}

// Fixed preview height (px). Each thumbnail keeps this height regardless of how
// many are shown; the width is derived from the aspect ratio.
const PREVIEW_HEIGHT = 120;

/**
 * A single live preview showing how the current crop + hotspot renders at one
 * target aspect ratio. Uses the shared preview geometry so it matches the site.
 */
export const AspectRatioPreview = ({
    src,
    imageWidth,
    imageHeight,
    crop,
    hotspot,
    aspectRatio
}: AspectRatioPreviewProps) => {
    const styles = getPreviewStyles(imageWidth, imageHeight, crop, hotspot, aspectRatio.ratio);
    const width = Math.round(PREVIEW_HEIGHT * aspectRatio.ratio);

    return (
        <div className={"flex flex-col items-center gap-xs"}>
            <div
                className={
                    "relative overflow-hidden rounded-sm border border-neutral-dimmed bg-neutral-light"
                }
                style={{ width: `${width}px`, height: `${PREVIEW_HEIGHT}px` }}
            >
                <img src={src} alt={""} style={styles.image} draggable={false} />
            </div>
            <span className={"text-sm text-neutral-strong"}>{aspectRatio.label}</span>
        </div>
    );
};
