const TAIL_STEM_CHARS = 3;

export const splitFileName = (name: string) => {
    const dot = name.lastIndexOf(".");

    if (dot <= 0) {
        return { head: name, tail: "" };
    }

    const cut = dot - Math.min(TAIL_STEM_CHARS, dot);

    if (cut <= 0) {
        return { head: name, tail: "" };
    }

    const head = name.slice(0, cut);
    const tail = name.slice(cut);

    if (head.length <= tail.length) {
        return { head: name, tail: "" };
    }

    return { head, tail };
};
