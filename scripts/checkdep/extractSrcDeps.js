const glob = require("glob");
const fs = require("fs");

const parseImports = source => {
    const regexes = [
        /import[ ]+['"]([~@a-zA-Z]{1}[@a-zA-Z0-9-_./]+)['"]/g,
        /from[ ]+['"]([~@a-zA-Z]{1}[@a-zA-Z0-9-_./]+)['"]/g,
        /require\(['"]([~@a-zA-Z]{1}[@a-zA-Z0-9-_\.\/]+)['"]/g
    ];

    const results = [];
    regexes.forEach(regex => {
        let m;
        while ((m = regex.exec(source)) !== null) {
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            const parts = m[1].split('/');

            if (parts.length === 1) {
                results.push(parts[0]);
            } else {
                if (parts[0].startsWith('@')) {
                    results.push(`${parts[0]}/${parts[1]}`);
                } else {
                    results.push(parts[0]);
                }
            }
        }
    });

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
