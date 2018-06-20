const _ = require("lodash");
const path = require("path");

const regex = /import\((.+?)\)/g;
const files = [];

module.exports = function hotAcceptLoader(source) {
    let m;
    const res = path.parse(this.resource);
    const children = [];

    do {
        m = regex.exec(source);
        if (m) {
            let ip = m[1];
            ip = _.trim(ip, "'");
            ip = _.trim(ip, '"');

            const child = path.join(res.dir, ip);
            files.push(child);
            children.push(ip);
        }
    } while (m);

    if (children.length) {
        const modules = children.map(c => `'` + c + `'`).join(", ");
        source += "\nmodule.hot.accept([" + modules + "], () => {})";
    }

    if (files.includes(path.join(res.dir, res.name))) {
        return `
            ${source}
            module.hot.accept(() => {});
        `;
    }

    return source;
};
