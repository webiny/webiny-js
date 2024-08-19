import loadJson from "load-json-file";
import writeJson from "write-json-file";
import { PackageJson } from "@webiny/cli-plugin-scaffold/types";
import { formatCode } from "@webiny/cli-plugin-scaffold/utils";
import { Extension } from "~/extensions/Extension";

const setVersions = (dependencies: Record<string, string>, version: string) => {
    for (const [name] of Object.entries(dependencies)) {
        if (name.startsWith("@webiny")) {
            dependencies[name] = version;
        }
    }
};

// Set the versions of the Webiny packages to the current version.
// This is needed in cases where an extension downloaded from the `webiny-examples` repository
// has dependencies on Webiny packages that are different from the current version. We need to
// update those dependencies to the current version.
export const setWebinyPackageVersions = async (
    extension: Extension,
    currentWebinyVersion: string
) => {
    const pkgJsonPath = extension.getPackageJsonPath();
    const pkgJson = await loadJson<PackageJson>(pkgJsonPath);

    if (pkgJson.dependencies) {
        setVersions(pkgJson.dependencies, currentWebinyVersion);
    }

    if (pkgJson.devDependencies) {
        setVersions(pkgJson.devDependencies, currentWebinyVersion);
    }

    if (pkgJson.peerDependencies) {
        setVersions(pkgJson.peerDependencies, currentWebinyVersion);
    }

    await writeJson(pkgJsonPath, pkgJson);
    await formatCode(pkgJsonPath, {});
};
