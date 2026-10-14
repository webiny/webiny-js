/** The capture's desktop width: a page compared at any other width would lay out differently. */
export const CAPTURE_WIDTH = 1440;

/** The height a frame gets when the source page's height is not known. */
export const UNKNOWN_HEIGHT = 4000;

export interface CompareFrames {
    /** Each page renders at this size, then is scaled down to its column. */
    frameWidth: number;
    frameHeight: number;
    scale: number;
    /** The column's size on screen: the frame after scaling. */
    columnWidth: number;
    columnHeight: number;
}

/**
 * Sizes the two frames of a page comparison so one scroll moves both.
 *
 * A frame can't be scrolled from outside — the pages are on other origins — so each frame is made as
 * tall as its whole page, and the two sit in one scroll area. The height is the source page's, read
 * off its full-page capture at the capture width; both frames get it, so the same height on screen is
 * the same height on both pages. The pages render at the capture width and are scaled down to fit
 * two columns, so each lays out as it did when it was captured rather than at half a screen.
 */
export const compareFrames = (
    available: number,
    gap: number,
    capture: { width: number; height: number } | null
): CompareFrames => {
    const frameWidth = CAPTURE_WIDTH;
    // Scaled to the capture width, in case the stored image was resized from it.
    const frameHeight =
        capture && capture.width > 0
            ? Math.round(capture.height * (CAPTURE_WIDTH / capture.width))
            : UNKNOWN_HEIGHT;
    const columnWidth = Math.max(0, Math.floor((available - gap) / 2));
    const scale = columnWidth / frameWidth;
    return {
        frameWidth,
        frameHeight,
        scale,
        columnWidth,
        columnHeight: Math.round(frameHeight * scale)
    };
};
