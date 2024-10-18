import fs from "fs";
import path from "path";
import camelCase from "lodash/camelCase";
import { formatCode } from "@webiny/cli-plugin-scaffold/utils";
import { ExtensionWorkspace } from "./getExtensionsFromFilesystem";

export const generatePbElementExtensions = async (extensions: ExtensionWorkspace[]) => {
    //
    // const extensionsFilePath = path.join("apps", "admin", "src", "Extensions.tsx");
    //
    // const code: string[][] = [];
    //
    // extensions.forEach(extension => {
    //     const name = camelCase(path.basename(extension.path));
    //     const ucFirstName = name.charAt(0).toUpperCase() + name.slice(1);
    //     const componentName = ucFirstName + "Extension";
    //     const importStatement = `import { Extension as ${componentName}} from "${extension.packageJson.name}";`;
    //     code.push([importStatement, `<${componentName}/>`]);
    // });
    //
    // const extensionsFile = [
    //     `// This file is automatically updated via scaffolding utilities.`,
    //     `import React from "react";`,
    //     ...code.map(ext => ext[0]),
    //     "",
    //     `export const Extensions = () => { return (<>${code.map(ext => ext[1]).join("\n")}</>); };`
    // ];
    //
    // fs.writeFileSync(extensionsFilePath, extensionsFile.join("\n"));
    //
    // await formatCode(extensionsFilePath, {});
};
