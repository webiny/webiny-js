import readPkg from "read-pkg";

export default (config = {}) => {
    const root = config.root || process.cwd();
    const pkg = readPkg.sync(root);
    return {
        name: pkg.name,
        location: root,
        packageJSON: pkg
    };
};
