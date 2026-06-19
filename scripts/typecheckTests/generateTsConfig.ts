import fs from "fs";
import path from "path";

const CONFIG_NAME = "tsconfig.check-tests.json";

const config = {
    extends: "./tsconfig.json",
    compilerOptions: {
        composite: false,
        noEmit: true,
        declaration: false,
        declarationDir: null,
        emitDeclarationOnly: false,
        outDir: null,
        rootDir: null,
        rootDirs: null,
        paths: {
            "~/*": ["./src/*"],
            "~tests/*": ["./__tests__/*"]
        }
    },
    include: ["__tests__", "src"],
    references: []
};

export const generateTsConfig = (packageFolder: string): string => {
    const configPath = path.join(packageFolder, CONFIG_NAME);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return configPath;
};

export const removeTsConfig = (packageFolder: string): void => {
    const configPath = path.join(packageFolder, CONFIG_NAME);
    try {
        fs.unlinkSync(configPath);
    } catch {
        /* Already removed. */
    }
};
