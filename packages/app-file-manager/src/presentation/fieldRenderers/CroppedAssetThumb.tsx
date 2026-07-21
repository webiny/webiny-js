import React from "react";
import { getCroppedImageRenderStyles } from "@webiny/admin-ui";
import type { AssetImageValue } from "./assetValue.js";

interface CroppedAssetThumbProps {
    src: string;
    name: string;
    image: AssetImageValue;
}

/**
 * Fills its parent thumbnail box (the FilePicker's 56px square) with the asset's
 * per-usage crop, cropping the crop region toward the focal point (`cover`) — the
 * same square footprint and `object-cover` feel as the default thumbnail, just
 * showing the cropped/focused region instead of the whole image.
 */
export const CroppedAssetThumb = ({ src, name, image }: CroppedAssetThumbProps) => {
    const { wrapper, image: imageStyle } = getCroppedImageRenderStyles(
        image.width ?? 0,
        image.height ?? 0,
        image.crop ?? undefined,
        image.focalPoint
            ? { x: image.focalPoint.x, y: image.focalPoint.y, width: 1, height: 1 }
            : undefined,
        // Square target (the thumbnail box is square); cover fills the parent box.
        { boxWidth: 1, boxHeight: 1, fit: "cover" }
    );

    return (
        <div style={wrapper}>
            <img src={src} alt={name} draggable={false} style={imageStyle} />
        </div>
    );
};
