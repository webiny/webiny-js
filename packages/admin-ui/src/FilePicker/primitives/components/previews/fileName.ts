/**
 * How many characters of the stem to keep alongside the extension when a file name is too long
 * to fit. Enough to preserve a version or ordinal suffix - "…-v2.png" rather than "….png".
 */
const TAIL_STEM_CHARS = 3;

/**
 * Splits a file name into the part that may be truncated and the part that must stay visible.
 *
 * CSS can only cut the tail of a string, which is the least useful end of a file name - it hides
 * the extension and any "-v2"/"-final" suffix, the two things that tell near-identical uploads
 * apart. Rendering the head in a truncating element and pinning the tail after it moves the
 * ellipsis into the middle without measuring anything.
 */
export const splitFileName = (name: string) => {
    const dot = name.lastIndexOf(".");

    // No extension, or a dotfile like ".gitignore" - there is no meaningful tail to pin.
    if (dot <= 0) {
        return { head: name, tail: "" };
    }

    const cut = dot - Math.min(TAIL_STEM_CHARS, dot);

    // The whole name is extension-and-a-bit; pinning all of it would defeat the truncation.
    if (cut <= 0) {
        return { head: name, tail: "" };
    }

    const head = name.slice(0, cut);
    const tail = name.slice(cut);

    // On a short name the pinned tail can end up longer than the part left to truncate
    // ("photo.jpeg" would pin "oto.jpeg"), which reads as nonsense. Such names rarely overflow
    // anyway, so fall back to ordinary end truncation.
    if (head.length <= tail.length) {
        return { head: name, tail: "" };
    }

    return { head, tail };
};
