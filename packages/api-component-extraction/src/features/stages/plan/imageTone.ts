import type { SectionImageFact } from "~/domain/artifacts.js";

/**
 * Whether a picture is light or dark, and whether it is see-through.
 *
 * A logo exported white on a transparent background is invisible on a white surface, and nothing told
 * Generate it was white: Freehill's footer put its white logo on a white panel. The crop shows the logo
 * on the page's teal, which the model may or may not carry over. So the file itself is measured.
 *
 * Measured over the opaque pixels only — a transparent logo's empty area says nothing about the logo.
 */

/** Mean luminance (0-255) above which a picture reads as light, below which as dark. */
const LIGHT = 190;
const DARK = 70;
/** A picture with at least this share of see-through pixels is drawn over whatever is behind it. */
const TRANSPARENT_SHARE = 0.2;

export const measureTone = async (
    bytes: Uint8Array
): Promise<Pick<SectionImageFact, "tone" | "transparent">> => {
    // Lazily: `sharp` is a Lambda-layer native module present on the background-task runtime only.
    const sharp = (await import("sharp")).default;
    const { data, info } = await sharp(bytes, { limitInputPixels: false })
        .resize(48, 48, { fit: "inside" })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    let opaque = 0;
    let see = 0;
    let luminance = 0;
    for (let i = 0; i < data.length; i += info.channels) {
        if (data[i + 3] < 128) {
            see++;
            continue;
        }
        opaque++;
        luminance += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    }
    const pixels = opaque + see;
    const mean = opaque > 0 ? luminance / opaque : 0;
    return {
        tone: mean >= LIGHT ? "light" : mean <= DARK ? "dark" : "mid",
        transparent: pixels > 0 && see / pixels >= TRANSPARENT_SHARE
    };
};

/** Bounded so one slow image host cannot hold up a Plan stage. */
const FETCH_TIMEOUT_MS = 5000;

/**
 * Fetches and measures a picture, once per URL per Plan run. Best-effort: a picture that cannot be
 * fetched or read is reported without a tone rather than holding up the plan.
 */
export const createToneReader = (fetcher: typeof fetch = fetch) => {
    const cache = new Map<string, Promise<Pick<SectionImageFact, "tone" | "transparent"> | null>>();
    return (url: string) => {
        if (!cache.has(url)) {
            cache.set(
                url,
                (async () => {
                    try {
                        const response = await fetcher(url, {
                            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
                        });
                        if (!response.ok) {
                            return null;
                        }
                        return await measureTone(new Uint8Array(await response.arrayBuffer()));
                    } catch {
                        return null;
                    }
                })()
            );
        }
        return cache.get(url)!;
    };
};
