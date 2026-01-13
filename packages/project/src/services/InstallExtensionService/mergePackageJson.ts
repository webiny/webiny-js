import loadJson from "load-json-file";
import writeJson from "write-json-file";
import deepmerge from "deepmerge";

interface MergePackageJsonParams {
    projectRoot: string;
    extensionPackageJson: Record<string, any>;
}

/**
 * Merge extension package.json properties into the project's root package.json.
 */
export const mergePackageJson = async (params: MergePackageJsonParams): Promise<void> => {
    const { projectRoot, extensionPackageJson } = params;

    const packageJsonPath = `${projectRoot}/package.json`;

    // Load the current package.json
    const currentPackageJson = await loadJson<Record<string, any>>(packageJsonPath);

    // Merge the extension's package.json into the current one
    // Use deepmerge to combine arrays and objects properly
    const mergedPackageJson = deepmerge(currentPackageJson, extensionPackageJson, {
        // For arrays, concatenate and remove duplicates
        arrayMerge: (target, source) => {
            const combined = [...target, ...source];
            return Array.from(new Set(combined));
        }
    });

    // Write the merged package.json back
    await writeJson(packageJsonPath, mergedPackageJson);
};
