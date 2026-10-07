import type { SectionImageFact } from "~/domain/artifacts.js";

export { isTranslucent, TRANSLUCENT_BELOW } from "./translucency.js";

/**
 * Whether a picture is light or dark, whether it is see-through, and how much of what is behind it
 * shows through.
 *
 * A logo exported white on a transparent background is invisible on a white surface, and nothing told
 * Generate it was white: Freehill's footer put its white logo on a white panel. The crop shows the logo
 * on the page's teal, which the model may or may not carry over. So the file itself is measured.
 *
 * Tone is measured over the opaque pixels — a transparent logo's empty area says nothing about the
 * logo. A picture with no opaque pixel at all is measured over what it does paint, weighted by how much
 * it paints: Park city's background pattern is faint white lines at 10-20% opacity, and the opaque-only
 * average, finding nothing, stayed at 0 and reported it as "dark". A default that reads as a
 * measurement. A picture that paints nothing has no tone, and says so by having none.
 */

/** Mean luminance (0-255) above which a picture reads as light, below which as dark. */
const LIGHT = 190;
const DARK = 70;
/** A picture with at least this share of see-through pixels is drawn over whatever is behind it. */
const TRANSPARENT_SHARE = 0.2;

export type ImageTone = Pick<SectionImageFact, "tone" | "transparent" | "opacity">;

const toneOf = (mean: number): SectionImageFact["tone"] =>
    mean >= LIGHT ? "light" : mean <= DARK ? "dark" : "mid";

export const measureTone = async (bytes: Uint8Array): Promise<ImageTone> => {
    // Lazily: `sharp` is a Lambda-layer native module present on the background-task runtime only.
    const sharp = (await import("sharp")).default;
    const { data, info } = await sharp(bytes, { limitInputPixels: false })
        .resize(48, 48, { fit: "inside" })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    let pixels = 0;
    let opaque = 0;
    let see = 0;
    let luminance = 0;
    let alpha = 0;
    let weighted = 0;
    for (let i = 0; i < data.length; i += info.channels) {
        pixels++;
        const a = data[i + 3];
        const l = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        alpha += a;
        weighted += l * a;
        if (a < 128) {
            see++;
            continue;
        }
        opaque++;
        luminance += l;
    }
    const tone =
        opaque > 0 ? toneOf(luminance / opaque) : alpha > 0 ? toneOf(weighted / alpha) : undefined;
    return {
        ...(tone ? { tone } : {}),
        transparent: pixels > 0 && see / pixels >= TRANSPARENT_SHARE,
        ...(pixels > 0 ? { opacity: Math.round((alpha / (255 * pixels)) * 100) / 100 } : {})
    };
};

/** Bounded so one slow image host cannot hold up a stage. */
const FETCH_TIMEOUT_MS = 5000;

/**
 * Fetches and measures a picture, once per URL per stage run. Best-effort: a picture that cannot be
 * fetched or read is reported as null rather than holding up the stage, and the caller says so.
 */
export const createToneReader = (fetcher: typeof fetch = fetch) => {
    const cache = new Map<string, Promise<ImageTone | null>>();
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
