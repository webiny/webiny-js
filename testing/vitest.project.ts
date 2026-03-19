import fs from "fs-extra";
import path from "path";

export const testPattern = `/{__tests__,src}/**/*.{test,test-d}.[jt]s?(x)`;

const getPackageMetaFromPackageJson = (pkgJson: any) => {
    return {
        packageName: pkgJson.getJson().name,
        packageRoot: path.dirname(pkgJson.getLocation())
    };
};

const getPackageMetaFromPath = async (value: string) => {
    const { PackageJson } = await import("@webiny/build-tools/utils/PackageJson.js");
    // The exact test file path usually happens when we run tests via IDE.
    const request = path.resolve(value);

    if (fs.existsSync(request)) {
        const pkgJson = await PackageJson.findClosest(request);
        const stat = fs.lstatSync(request);

        const testMatch = stat.isFile() ? [request] : [`${request}${testPattern}`];

        return { ...getPackageMetaFromPackageJson(pkgJson), testMatch };
    }

    // `yarn test api-headless-cms`
    if (!value.includes(".") && !value.includes("/")) {
        // Means we're testing a package from `packages` folder.
        const request = path.resolve("packages", value);
        const pkgJson = await PackageJson.findClosest(request);

        return {
            ...getPackageMetaFromPackageJson(pkgJson),
            testMatch: [`${request}${testPattern}`]
        };
    }

    // For all other use cases, we simply assume it's a relative path from project root.
    //E.g., packages/validation, scripts/cjsToEsm
    const pkgJson = await PackageJson.findClosest(request);
    return {
        ...getPackageMetaFromPackageJson(pkgJson),
        testMatch: [`${request}${testPattern}`]
    };
};

export const getPackageMeta = async () => {
    const target = process.argv.find(param => param.includes("packages/"));

    if (target) {
        return getPackageMetaFromPath(target);
    }

    throw new Error(
        `Unable to parse package to test! Make sure the package path includes "packages/{name}"`
    );
};
