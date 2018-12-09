const path = require("path");
const readPkg = require("read-pkg");
const globby = require("globby");

// Get packages to process
module.exports = glob => {
    if (!glob) {
        throw new Error("Missing packages glob!");
    }
    
    return globby
        .sync(glob, { onlyDirectories: true, cwd: process.cwd() })
        .map(dir => {
            const pkg = readPkg.sync({ cwd: dir, normalize: false });
            return {
                name: pkg.name,
                location: path.join(process.cwd(), dir),
                package: pkg
            };
        })
        .filter(pkg => !pkg.package.private);
};
