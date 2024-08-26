import fs from "fs";
import path from "path";
import { formatCode } from "@webiny/cli-plugin-scaffold/utils";
import { ExtensionWorkspace } from "./getExtensionsFromFilesystem";

export const generateApiExtensions = async (extensions: ExtensionWorkspace[]) => {
    const extensionsFilePath = path.join("apps", "api", "graphql", "src", "extensions.ts");
    const code: string[][] = [];

    extensions.forEach(extension => {
        const name = path.basename(extension.path);
        const extensionFactory = name + "ExtensionFactory";
        const importStatement = `import { createExtension as ${extensionFactory}} from "${extension.packageJson.name}";`;
        code.push([importStatement, `${extensionFactory}()`]);
    });

    const extensionsFile = [
        "// This file is automatically updated via scaffolding utilities.",
        ...code.map(ext => ext[0]),
        "export const extensions = () => {",
        "return [",
        code.map(ext => ext[1]).join(","),
        "];};"
    ];

    fs.writeFileSync(extensionsFilePath, extensionsFile.join("\n"));

    await formatCode(extensionsFilePath, {});
};
