import { getExtensionsFromFilesystem } from "./getExtensionsFromFilesystem";
import { generateApiExtensions } from "./generateApiExtensions";
import { generateAdminExtensions } from "./generateAdminExtensions";
import { generatePbElementExtensions } from "./generatePbElementExtensions";
import { registerWorkspaces } from "./registerWorkspaces";

export const linkAllExtensions = async () => {
    const allExtensions = getExtensionsFromFilesystem();
    const apiExtensions = allExtensions.filter(extension => extension.type === "api");
    const adminExtensions = allExtensions.filter(extension => extension.type === "admin");
    const pbElementExtensions = allExtensions.filter(extension => extension.type === "pb-element");

    await Promise.all([
        generateApiExtensions(apiExtensions),
        generateAdminExtensions(adminExtensions),
        generatePbElementExtensions(pbElementExtensions),
        registerWorkspaces(allExtensions)
    ]);
};
