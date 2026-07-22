/**
 * Build the turnkey delivery URL for a stored Asset field value.
 *
 * The Asset field stores `src` as the file's **base delivery URL** (the pristine
 * original) with the per-usage crop kept beside it in `image.crop`. The delivery
 * pipeline frames the image only when the URL carries a `?crop=` param, so a raw
 * `src` never reflects the per-usage crop. This helper bakes that crop into the URL
 * — it is what the generated `url` field on the Asset GraphQL type resolves to, so a
 * headless consumer (any framework) gets a ready-to-use URL without having to know
 * the delivery param contract.
 *
 * Note: only the per-usage crop is added here. Any **asset-level** crop (set in File
 * Manager, stored on the file's metadata) is already baked in by the delivery on any
 * GET of the base `src`, and a per-usage crop replaces — not composes with — it, so
 * `src` + `?crop=<per-usage>` is the correct combined result.
 */

interface AssetImageCrop {
    top?: number | null;
    left?: number | null;
    bottom?: number | null;
    right?: number | null;
}

interface AssetValue {
    src?: string | null;
    image?: { crop?: AssetImageCrop | null } | null;
}

const round = (n: number): number => Math.round(n * 10000) / 10000;

/** `top,left,bottom,right` crop param, or `undefined` for a missing/full (no-op) crop. */
const cropParam = (crop: AssetImageCrop | null | undefined): string | undefined => {
    if (!crop) {
        return undefined;
    }
    const top = crop.top ?? 0;
    const left = crop.left ?? 0;
    const bottom = crop.bottom ?? 0;
    const right = crop.right ?? 0;
    if (top === 0 && left === 0 && bottom === 0 && right === 0) {
        return undefined;
    }
    return [top, left, bottom, right].map(round).join(",");
};

/**
 * The stored `src` with the per-usage crop baked in as a `?crop=` delivery param.
 * Returns `src` unchanged when there is no per-usage crop, and `null` when the value
 * has no source.
 */
export const resolveAssetUrl = (asset: AssetValue | null | undefined): string | null => {
    const src = asset?.src;
    if (!src) {
        return null;
    }
    const param = cropParam(asset?.image?.crop);
    if (!param) {
        return src;
    }
    const separator = src.includes("?") ? "&" : "?";
    return `${src}${separator}crop=${param}`;
};
