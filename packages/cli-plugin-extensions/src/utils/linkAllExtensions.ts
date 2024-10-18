import { getExtensionsFromFilesystem } from "./getExtensionsFromFilesystem";
import { Extension } from "~/extensions/Extension";

export const linkAllExtensions = async () => {
    const allExtensions = getExtensionsFromFilesystem();

    for (const allExtension of allExtensions) {
        const extension = await Extension.fromPackageJsonPath(allExtension.paths.packageJson);
        if (extension) {
            await extension.link();
        }
    }
};
