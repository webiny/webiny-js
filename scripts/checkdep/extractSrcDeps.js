const glob = require("glob");
const fs = require("fs");

const parseImports = source => {
    let regex = /import.*from.*['"]([a-zA-Z0-9-_@\.]*).*['"]/g;
    let m;

    const results = [];

    while ((m = regex.exec(source)) !== null) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        results.push(m[1]);
    }

    regex = / require\(['"]([a-zA-Z0-9-_@\.]*)['"]/g;
    while ((m = regex.exec(source)) !== null) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        results.push(m[1]);
    }

    return results;
};

const isIgnoredPath = ({ path, config, packageConfig }) => {
    let dirs = config.ignoredDirs || [];
    for (let i = 0; i < dirs.length; i++) {
        let dir = dirs[i];
        if (path.includes(dir)) {
            return true;
        }
    }

    dirs = packageConfig.ignoredDirs || [];
    for (let i = 0; i < dirs.length; i++) {
        let dir = dirs[i];
        if (path.includes(dir)) {
            return true;
        }
    }
    return false;
};

module.exports = ({ dir, path, config, packageConfig }) => {
    const paths = glob.sync(dir + "/**/*.js");
    const deps = [];
    paths.forEach(path => {
        if (isIgnoredPath({ path, config, packageConfig })) {
            return true;
        }

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
