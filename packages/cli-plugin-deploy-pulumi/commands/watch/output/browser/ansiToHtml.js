const colorConvert = require("color-convert");

const ansiToHtml = text => {
    // Try matching true colors.
    text = colorsTrue(text);

    // Try matching 256 colors.
    text = colors256(text);

    // Try matching standard colors.
    text = colorsStandard(text);

    // `\033[1m` enables bold font, `\033[22m` disables it
    //
    text = text.replace(/\033\[1m/g, "<b>").replace(/\033\[22m/g, "</b>");

    //
    // `\033[3m` enables italics font, `\033[23m` disables it
    //
    text = text.replace(/\033\[3m/g, "<i>").replace(/\033\[23m/g, "</i>");

    text = text.replace(/\033\[m/g, "</span>");
    text = text.replace(/\033\[0m/g, "</span>");
    text = text.replace(/\033\[39m/g, "</span>");

    return text;
};

const colorsStandard = text => {
    const colorsMap = {
        "30": "black",
        "31": "red",
        "32": "green",
        "33": "yellow",
        "34": "blue",
        "35": "purple",
        "36": "cyan",
        "37": "white"
    };

    const theme = {
        "name": "Atom",
        "black": "#000000",
        "red": "#fd5ff1",
        "green": "#87c38a",
        "yellow": "#ffd7b1",
        "blue": "#85befd",
        "purple": "#b9b6fc",
        "cyan": "#85befd",
        "white": "#e0e0e0",
        "brightBlack": "#000000",
        "brightRed": "#fd5ff1",
        "brightGreen": "#94fa36",
        "brightYellow": "#f5ffa8",
        "brightBlue": "#96cbfe",
        "brightPurple": "#b9b6fc",
        "brightCyan": "#85befd",
        "brightWhite": "#e0e0e0",
        "background": "#161719",
        "foreground": "#c5c8c6",
        "selectionBackground": "#444444",
        "cursorColor": "#d0d0d0"
    };

    Object.keys(colorsMap).forEach(function(ansi) {
        const span = '<span style="color: ' + theme[colorsMap[ansi]] + '">';

        //
        // `\033[Xm` == `\033[0;Xm` sets foreground color to `X`.
        //

        text = text
            .replace(new RegExp("\033\\[" + ansi + "m", "g"), span)
            .replace(new RegExp("\033\\[0;" + ansi + "m", "g"), span);
    });

    return text;
};

const colorsTrue = text => {
    // Try matching true colors.
    const regex = /\033\[38;2;([0-9]+);([0-9]+);([0-9]+)m/gm;
    let m;

    while ((m = regex.exec(text)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        const [, r, g, b] = m;
        const span = '<span style="color: #' + colorConvert.rgb.hex(r, g, b) + '">';

        text = text.replace(new RegExp("\033\\[38;2;" + r + ";" + g + ";" + b + "m", "gm"), span);
    }

    return text;
};

const colors256 = text => {
    // Try matching true colors.
    const regex = /\033\[38;5;([0-9]+)m/gm;
    let m;

    while ((m = regex.exec(text)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        const [, code] = m;
        const span = '<span style="color: #' + colorConvert.ansi256.hex(code) + '">';

        text = text.replace(new RegExp("\033\\[38;5;" + code + "m", "gm"), span);
    }

    return text;
};

module.exports = ansiToHtml;
