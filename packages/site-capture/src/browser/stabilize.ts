import type { FontLoadingReport } from "~/abstractions.js";

/**
 * Making a page hold still before it is read and photographed.
 *
 * Two things move between the moment the tree is read and the moment the camera fires: motion
 * (entrance animations, transitions, auto-advancing sliders built on CSS) and fonts (a web font that
 * arrives late swaps in and reflows every line it sets). Either one makes the boxes in the tree and the
 * pixels in the screenshot describe different pages, and nothing downstream can tell which is right.
 */

/**
 * Motion collapsed to its end state. A zero duration jumps an animation to its end, so a fade-in shows
 * its element visible and a slide-in shows it in place; transitions finish the moment a class changes.
 * `scroll-behavior` matters to tiled screenshots: a smooth `scrollTo` would still be travelling when
 * the tile is shot.
 */
export const FREEZE_MOTION_CSS = `
*, *::before, *::after {
    animation-delay: 0s !important;
    animation-duration: 0s !important;
    animation-iteration-count: 1 !important;
    transition-delay: 0s !important;
    transition-duration: 0s !important;
    scroll-behavior: auto !important;
    caret-color: transparent !important;
}
html { scroll-behavior: auto !important; }
`;

/**
 * Finishes whatever is already running through the Web Animations API — CSS animations included —
 * since a stylesheet added mid-animation does not always restart the ones in flight. An infinite
 * animation cannot be finished, so it is paused where it is instead.
 */
export const finishAnimationsScript = (): string => `(() => {
    if (typeof document.getAnimations !== "function") {
        return 0;
    }
    let settled = 0;
    for (const animation of document.getAnimations()) {
        try {
            animation.finish();
        } catch {
            try {
                animation.pause();
            } catch {}
        }
        settled++;
    }
    return settled;
})()`;

export interface ObservedFontFace {
    family: string;
    status: string;
}

/**
 * What the page's font faces say once the wait is over.
 *
 * `error` is a face the browser tried and failed to load — the page is set in a fallback where that
 * face was declared. `loading` after the wait is a face that had not arrived in time. `unloaded` is
 * a face nothing on the page asked for, which is not a problem and is not reported.
 */
export const summarizeFontFaces = (
    faces: ObservedFontFace[],
    ready: boolean
): FontLoadingReport => {
    const familyOf = (face: ObservedFontFace) => face.family.replace(/^["']|["']$/g, "").trim();
    const failed = [...new Set(faces.filter(f => f.status === "error").map(familyOf))];
    const pending = [...new Set(faces.filter(f => f.status === "loading").map(familyOf))].filter(
        family => !failed.includes(family)
    );
    return { ready, failed, pending };
};

/**
 * Waits for `document.fonts.ready` up to `timeoutMs`, then reports every face's status. Returns the raw
 * faces and whether the wait completed; `summarizeFontFaces` turns that into the report.
 */
export const fontLoadingScript = (timeoutMs: number): string => `(async () => {
    if (!document.fonts) {
        return { ready: true, faces: [] };
    }
    const ready = await Promise.race([
        document.fonts.ready.then(() => true),
        new Promise(resolve => setTimeout(() => resolve(false), ${Math.max(0, Math.floor(timeoutMs))}))
    ]);
    const faces = [];
    document.fonts.forEach(face => faces.push({ family: face.family, status: face.status }));
    return { ready, faces };
})()`;
