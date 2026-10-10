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
    const targets = process.argv.filter(param => param.includes("packages/"));
    const target = targets[0];

    if (target) {
        const meta = await getPackageMetaFromPath(target);
        /*
         * One package per run: the config, setup file and test match below are that package's. A second
         * package path used to be ignored without a word, so `yarn test packages/a packages/b` ran a's
         * tests and reported them as a green run of both. Measured 2026-10-10: a "both packages" run
         * left 130 of api-page-composition-poc's tests unrun all day. Refuse instead.
         */
        const others = [];
        for (const other of targets.slice(1)) {
            const otherMeta = await getPackageMetaFromPath(other);
            if (otherMeta.packageRoot !== meta.packageRoot) {
                others.push(otherMeta.packageName);
            }
        }
        if (others.length > 0) {
            throw new Error(
                `Tests run one package at a time; this run would test only ${meta.packageName} and skip ${others.join(", ")}. Run each package separately.`
            );
        }
        return meta;
    }

    throw new Error(
        `Unable to parse package to test! Make sure the package path includes "packages/{name}"`
    );
};
