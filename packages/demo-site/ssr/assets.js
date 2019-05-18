// Use `raw-loader` to copy the value of index.html into the SSR bundle.
// This way the bundle contains all it's dependencies and can be used entirely on its own.
import indexHtml from "!!raw-loader!../build/index.html";

const extract = (pattern, string) => {
    const matches = [];
    const re = new RegExp(pattern, "g");
    let match = re.exec(string);
    while (match !== null) {
        matches.push(match[1]);
        match = re.exec(string);
    }
    return matches;
};

export default {
    css: extract('<link href="(.+?)" rel="stylesheet">', indexHtml),
    js: extract('<script src="(.+?)"></script>', indexHtml)
};
