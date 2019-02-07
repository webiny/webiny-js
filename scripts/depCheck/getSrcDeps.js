const glob = require("glob");
const fs = require("fs");

const parseImports = source => {
    const regex = /import.*from.*['"]([a-zA-Z0-9-_@]*).*['"]/g;
    let m;

    const results = [];

    while ((m = regex.exec(source)) !== null) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        results.push(m[1]);
    }

    return results;
};

module.exports = dir => {
    const paths = glob.sync(dir + "/**/*.js");
    const deps = [];
    paths.forEach(path => {
        const src = fs.readFileSync(path, "utf8");
        const imports = parseImports(src);
        imports.forEach(name => {
            // is relative import?
            if (!name || name.startsWith(".")) {
                return true;
            }

            // already included in deps?
            if (deps.includes(name)) {
                return true;
            }

            deps.push(name);
        });
    });

    return deps;
};
