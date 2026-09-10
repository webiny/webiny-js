import type { ImageEditorValue } from "@webiny/admin-ui";
import type { FileManagerFileItem } from "@webiny/app-admin/base/ui/FileManager.js";
import type { Asset, AssetImage } from "@webiny/sdk";

export type { Asset, AssetImage };

export const isImageAsset = (asset: Asset | null | undefined): boolean => {
    return typeof asset?.type === "string" && asset.type.startsWith("image/");
};

export const hasAsset = (asset: Asset | null | undefined): boolean => {
    return typeof asset?.src === "string" && asset.src.length > 0;
};

const isFullCrop = (crop: AssetImage["crop"]): boolean => {
    return !crop || (crop.top === 0 && crop.left === 0 && crop.bottom === 0 && crop.right === 0);
};

const isCenteredFocal = (focalPoint: AssetImage["focalPoint"]): boolean => {
    return !focalPoint || (focalPoint.x === 0.5 && focalPoint.y === 0.5);
};

export const hasImageEdit = (image: AssetImage | null | undefined): boolean => {
    if (!image) {
        return false;
    }
    return !isFullCrop(image.crop) || !isCenteredFocal(image.focalPoint);
};

interface FileImageMetadata {
    width?: number;
    height?: number;
    crop?: { top: number; left: number; bottom: number; right: number };
    focalPoint?: { x: number; y: number };
    alt?: string;
    caption?: string;
}

export const fileItemToAsset = (file: FileManagerFileItem): Asset => {
    const src = file.src;
    const asset: Asset = {
        id: file.id,
        src,
        url: src,
        name: file.name,
        type: file.type,
        size: file.size
    };
    if (typeof file.type === "string" && file.type.startsWith("image/")) {
        const meta = file.metadata?.image as FileImageMetadata | undefined;
        const image: AssetImage = {
            width: meta?.width ?? file.width,
            height: meta?.height ?? file.height
        };
        if (meta?.crop) {
            image.crop = meta.crop;
        }
        if (meta?.focalPoint) {
            image.focalPoint = { x: meta.focalPoint.x, y: meta.focalPoint.y };
        }
        if (meta?.alt) {
            image.alt = meta.alt;
        }
        if (meta?.caption) {
            image.caption = meta.caption;
        }
        asset.image = image;
        asset.url = buildAssetUrl(src, image.crop);
    }
    return asset;
};

export const assetImageToEditorValue = (
    image: AssetImage | null | undefined
): ImageEditorValue | undefined => {
    if (!image) {
        return undefined;
    }
    return {
        crop: image.crop ?? undefined,
        hotspot: image.focalPoint
            ? { x: image.focalPoint.x, y: image.focalPoint.y, width: 1, height: 1 }
            : undefined,
        alt: image.alt ?? undefined,
        caption: image.caption ?? undefined
    };
};

export const applyImageEditToAsset = (asset: Asset, edit: ImageEditorValue): Asset => {
    const crop = edit.crop ?? undefined;
    return {
        ...asset,
        url: buildAssetUrl(asset.src, crop),
        image: {
            width: asset.image?.width,
            height: asset.image?.height,
            crop,
            focalPoint: edit.hotspot ? { x: edit.hotspot.x, y: edit.hotspot.y } : undefined,
            alt: edit.alt ?? undefined,
            caption: edit.caption ?? undefined
        }
    };
};

const round = (n: number): number => Math.round(n * 10000) / 10000;

function buildAssetUrl(src: string, crop: AssetImage["crop"] | null | undefined): string {
    if (!crop) {
        return src;
    }
    const top = crop.top ?? 0;
    const left = crop.left ?? 0;
    const bottom = crop.bottom ?? 0;
    const right = crop.right ?? 0;
    if (top === 0 && left === 0 && bottom === 0 && right === 0) {
        return src;
    }
    const param = [top, left, bottom, right].map(round).join(",");
    const separator = src.includes("?") ? "&" : "?";
    return `${src}${separator}crop=${param}`;
}
