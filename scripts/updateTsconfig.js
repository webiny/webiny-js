const fsExtra = require("fs-extra");
const createPackagePath = pkg => {
    const name = pkg.replace("@webiny/", "");
    return `../${name}`;
};

const createPackageRelativePath = pkg => {
    const name = pkg.replace("@webiny/", "");
    return `../${name}`;
};

const packages = fsExtra.readdirSync("./packages");

const files = packages
    .map(pkg => {
        const packageFile = `./packages/${pkg}/package.json`;
        const tsconfigFile = `./packages/${pkg}/tsconfig.json`;
        const tsconfigbuildFile = `./packages/${pkg}/tsconfig.build.json`;

        if (
            !fsExtra.existsSync(packageFile) ||
            !fsExtra.existsSync(tsconfigbuildFile) ||
            !fsExtra.existsSync(tsconfigFile)
        ) {
            return null;
        }

        return {
            pkg,
            packageFile,
            tsconfigFile,
            tsconfigbuildFile
        };
    })
    .filter(Boolean);

for (const { pkg: currentPackage, packageFile, tsconfigFile, tsconfigbuildFile } of files) {
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
            return pkg.startsWith("@webiny/");
        });

    tsconfigJson.compilerOptions = {
        ...(tsconfigJson.compilerOptions || {}),
        paths: webinyPackages.reduce((acc, pkg) => {
            const path = createPackagePath(pkg);

            acc[`${pkg}/*`] = [`${path}/*`];
            acc[pkg] = [path];
            return acc;
        }, {})
    };

    tsconfigJson.references = webinyPackages.map(pkg => {
        return createPackageRelativePath(pkg);
    });

    tsconfigbuildJson.compilerOptions = {
        ...(tsconfigbuildJson.compilerOptions || {}),
        paths: {}
    };
    tsconfigbuildJson.references = [];

    fsExtra.writeJsonSync(tsconfigFile, tsconfigJson);
    fsExtra.writeJsonSync(tsconfigbuildFile, tsconfigbuildJson);
}
