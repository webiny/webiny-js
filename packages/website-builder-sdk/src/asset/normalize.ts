import type { Asset, AssetCategory, AssetImage } from "./types.js";

export function getAssetCategory(type?: string | null): AssetCategory {
    if (typeof type === "string") {
        if (type.startsWith("image/")) {
            return "image";
        }
        if (type.startsWith("video/")) {
            return "video";
        }
    }
    return "document";
}

const isObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null;
};

const asNumber = (value: unknown): number | undefined => {
    return typeof value === "number" && !Number.isNaN(value) ? value : undefined;
};

const asString = (value: unknown): string | undefined => {
    return typeof value === "string" ? value : undefined;
};

interface LegacyImageEdit {
    crop?: { top: number; left: number; bottom: number; right: number };
    hotspot?: { x: number; y: number; width?: number; height?: number };
    alt?: string;
    caption?: string;
}

export function assetImageFromLegacyEdit(
    edit?: LegacyImageEdit | null,
    dimensions?: { width?: number | null; height?: number | null }
): AssetImage | undefined {
    const image: AssetImage = {};

    const width = asNumber(dimensions?.width);
    const height = asNumber(dimensions?.height);
    if (width !== undefined) {
        image.width = width;
    }
    if (height !== undefined) {
        image.height = height;
    }

    if (edit?.crop) {
        image.crop = {
            top: edit.crop.top ?? 0,
            left: edit.crop.left ?? 0,
            bottom: edit.crop.bottom ?? 0,
            right: edit.crop.right ?? 0
        };
    }
    if (edit?.hotspot) {
        image.focalPoint = { x: edit.hotspot.x, y: edit.hotspot.y };
    }
    if (edit?.alt) {
        image.alt = edit.alt;
    }
    if (edit?.caption) {
        image.caption = edit.caption;
    }

    return Object.keys(image).length > 0 ? image : undefined;
}

const normalizeAssetImage = (raw: unknown): AssetImage | undefined => {
    if (!isObject(raw)) {
        return undefined;
    }
    const image: AssetImage = {};
    const width = asNumber(raw.width);
    const height = asNumber(raw.height);
    if (width !== undefined) {
        image.width = width;
    }
    if (height !== undefined) {
        image.height = height;
    }
    if (isObject(raw.crop)) {
        image.crop = {
            top: asNumber(raw.crop.top) ?? 0,
            left: asNumber(raw.crop.left) ?? 0,
            bottom: asNumber(raw.crop.bottom) ?? 0,
            right: asNumber(raw.crop.right) ?? 0
        };
    }
    if (isObject(raw.focalPoint)) {
        const x = asNumber(raw.focalPoint.x);
        const y = asNumber(raw.focalPoint.y);
        if (x !== undefined && y !== undefined) {
            image.focalPoint = { x, y };
        }
    }
    const alt = asString(raw.alt);
    if (alt) {
        image.alt = alt;
    }
    const caption = asString(raw.caption);
    if (caption) {
        image.caption = caption;
    }
    return Object.keys(image).length > 0 ? image : undefined;
};

const buildBase = (raw: Record<string, unknown>, type: string): Asset => {
    const src = asString(raw.src) ?? "";
    return {
        id: asString(raw.id) ?? "",
        src,
        url: asString(raw.url) ?? src,
        name: asString(raw.name) ?? "",
        type,
        size: asNumber(raw.size) ?? 0
    };
};

export function normalizeToAsset(input: unknown): Asset | null {
    if (!isObject(input)) {
        return null;
    }

    const hasTypedSubObject =
        isObject(input.image) || isObject(input.document) || isObject(input.video);

    if (!hasTypedSubObject) {
        const type = asString(input.mimeType) ?? asString(input.type) ?? "";
        const asset = buildBase(input, type);
        if (getAssetCategory(type) === "image") {
            const image = assetImageFromLegacyEdit(input.edit as LegacyImageEdit | undefined, {
                width: asNumber(input.width),
                height: asNumber(input.height)
            });
            if (image) {
                asset.image = image;
            }
        }
        return asset;
    }

    const type = asString(input.type) ?? asString(input.mimeType) ?? "";
    const asset = buildBase(input, type);
    const category = getAssetCategory(type);
    if (category === "image") {
        const image = normalizeAssetImage(input.image);
        if (image) {
            asset.image = image;
        }
    } else if (category === "video") {
        if (isObject(input.video)) {
            asset.video = {
                autoplay:
                    typeof input.video.autoplay === "boolean" ? input.video.autoplay : undefined,
                poster: asString(input.video.poster)
            };
        }
    } else if (isObject(input.document)) {
        asset.document = { pages: asNumber(input.document.pages) };
    }
    return asset;
}
