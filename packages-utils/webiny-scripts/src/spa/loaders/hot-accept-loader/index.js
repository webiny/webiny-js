import _ from "lodash";
import path from "path";

const regex = /import\((.+?)\)/g;
const files = [];

export default function hotAcceptLoader(source) {
    let m;
    const res = path.parse(this.resource);

    do {
        m = regex.exec(source);
        if (m) {
            let ip = m[1];
            ip = _.trim(ip, "'");
            ip = _.trim(ip, '"');

            files.push(path.join(res.dir, ip));
        }
    } while (m);

    if (files.includes(path.join(res.dir, res.name))) {
        source += "\nmodule.hot.accept(() => {})";
    }

    return source;
}
