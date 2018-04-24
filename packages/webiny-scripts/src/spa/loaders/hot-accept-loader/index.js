import _ from "lodash";
import path from "path";

const regex = /import\((.+?)\)/g;
const files = [];

export default function hotAcceptLoader(source) {
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
}
