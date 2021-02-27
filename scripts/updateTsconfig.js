const fsExtra = require("fs-extra");
const createPackagePath = pkg => {
    const name = pkg.replace("@webiny/", "");
    return `../${name}`;
};

const createPackageRelativePath = pkg => {
    const name = pkg.replace("@webiny/", "");
    return `../${name}`;
};

const packages = fsExtra.readdirSync("./packages").reduce((collection, pkg) => {
    const packageFile = `./packages/${pkg}/package.json`;
    const tsconfigFile = `./packages/${pkg}/tsconfig.json`;
    const tsconfigbuildFile = `./packages/${pkg}/tsconfig.build.json`;

    if (
        !fsExtra.existsSync(packageFile) ||
        !fsExtra.existsSync(tsconfigbuildFile) ||
        !fsExtra.existsSync(tsconfigFile)
    ) {
        return collection;
    }
    collection[pkg] = {
        pkg,
        packageFile,
        tsconfigFile,
        tsconfigbuildFile
    };
    return collection;
}, {});

for (const key in packages) {
    const pkg = packages[key];
    const { pkg: currentPackage, packageFile, tsconfigFile, tsconfigbuildFile } = pkg;
    const packageJson = fsExtra.readJsonSync(packageFile);
    const tsconfigJson = fsExtra.readJsonSync(tsconfigFile);
    const tsconfigbuildJson = fsExtra.readJsonSync(tsconfigbuildFile);

    // need to find all @webiny packages
    const webinyPackages = Object.keys(packageJson.dependencies || {})
        .concat(Object.keys(packageJson.devDependencies || {}))
        .filter(pkg => {
            // we must remove current package from being referenced or mentioned anywhere
            if (pkg === `@webiny/${currentPackage}`) {
                return false;
            }
            const isWebiny = pkg.startsWith("@webiny/");
            if (!isWebiny) {
                return false;
            }
            const name = pkg.replace("@webiny/", "");
            return !!packages[name];
        });

    tsconfigJson.compilerOptions = {
        ...(tsconfigJson.compilerOptions || {}),
        paths: webinyPackages.reduce((acc, pkg) => {
            const path = createPackagePath(pkg);

            acc[`${pkg}/*`] = [`${path}/src/*`];
            acc[pkg] = [`${path}/src`];
            return acc;
        }, {}),
        baseUrl: "."
    };

    tsconfigJson.references = webinyPackages.map(pkg => {
        return {
            path: createPackageRelativePath(pkg)
        };
    });

    tsconfigbuildJson.compilerOptions = {
        ...(tsconfigbuildJson.compilerOptions || {}),
        paths: {},
        baseUrl: "."
    };
    tsconfigbuildJson.references = [];

    fsExtra.writeFileSync(tsconfigFile, JSON.stringify(tsconfigJson, null, 2));
    fsExtra.writeFileSync(tsconfigbuildFile, JSON.stringify(tsconfigbuildJson, null, 2));
}
