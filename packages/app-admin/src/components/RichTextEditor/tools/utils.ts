export enum TextAlign {
    START = "start",
    END = "end",
    CENTER = "center"
}

export type Alignment = {
    name: TextAlign;
    svg: string;
};

export const ALIGNMENT_ICONS = {
    start:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">\n' +
        '  <path fill="none" d="M0 0h24v24H0V0z"/>\n' +
        "  <g>\n" +
        '    <path fill="currentColor" d="M14 15H4c-.55 0-1 .45-1 1s.45 1 1 1h10c.55 0 1-.45 1-1s-.45-1-1-1zm0-8H4c-.55 0-1 .45-1 1s.45 1 1 1h10c.55 0 1-.45 1-1s-.45-1-1-1zM4 13h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zm0 8h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zM3 4c0 .55.45 1 1 1h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1z"/>\n' +
        "  </g>\n" +
        "</svg>",
    end:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">\n' +
        '  <path fill="none" d="M0 0h24v24H0V0z"/>\n' +
        "  <g>\n" +
        '    <path fill="currentColor" d="M4 21h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zm6-4h10c.55 0 1-.45 1-1s-.45-1-1-1H10c-.55 0-1 .45-1 1s.45 1 1 1zm-6-4h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zm6-4h10c.55 0 1-.45 1-1s-.45-1-1-1H10c-.55 0-1 .45-1 1s.45 1 1 1zM3 4c0 .55.45 1 1 1h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1z"/>\n' +
        "  </g>\n" +
        "</svg>",
    center:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">\n' +
        '  <path fill="none" d="M0 0h24v24H0V0z"/>\n' +
        "  <g>\n" +
        '    <path fill="currentColor" d="M7 16c0 .55.45 1 1 1h8c.55 0 1-.45 1-1s-.45-1-1-1H8c-.55 0-1 .45-1 1zm-3 5h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zm0-8h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zm3-5c0 .55.45 1 1 1h8c.55 0 1-.45 1-1s-.45-1-1-1H8c-.55 0-1 .45-1 1zM3 4c0 .55.45 1 1 1h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1z"/>\n' +
        "  </g>\n" +
        "</svg>",
    justify:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">\n' +
        '  <path fill="none" d="M0 0h24v24H0V0z"/>\n' +
        "  <g>\n" +
        '    <path fill="currentColor" d="M4 21h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zm0-4h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zm0-4h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zm0-4h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zM3 4c0 .55.45 1 1 1h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1z"/>\n' +
        "  </g>\n" +
        "</svg>"
};

export const ALIGNMENTS = [
    {
        name: TextAlign.START,
        svg: ALIGNMENT_ICONS.start
    },
    {
        name: TextAlign.CENTER,
        svg: ALIGNMENT_ICONS.center
    },
    {
        name: TextAlign.END,
        svg: ALIGNMENT_ICONS.end
    }
];
