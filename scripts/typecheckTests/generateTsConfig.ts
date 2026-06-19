import fs from "fs";
import path from "path";
import { loadJsonFileSync } from "load-json-file";

const CONFIG_NAME = "tsconfig.check-tests.json";

/* Rewrite dependency path aliases from src/ to dist/ so tsc resolves
   from built .d.ts files and avoids cross-package ~/* collisions. */
const rewritePaths = (packageFolder: string): Record<string, string[]> => {
    const tsconfig = loadJsonFileSync(path.join(packageFolder, "tsconfig.json")) as {
        compilerOptions?: { paths?: Record<string, string[]> };
    };

    const original = tsconfig.compilerOptions?.paths ?? {};
    const rewritten: Record<string, string[]> = {
        "~/*": ["./src/*"],
        "~tests/*": ["./__tests__/*"]
    };

    for (const [key, values] of Object.entries(original)) {
        if (key === "~/*" || key === "~tests/*") {
            continue;
        }

        rewritten[key] = values.map(v => v.replace("/src/", "/dist/").replace("/src", "/dist"));
    }

    return rewritten;
};

export const generateTsConfig = (packageFolder: string): string => {
    const configPath = path.join(packageFolder, CONFIG_NAME);

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
            paths: rewritePaths(packageFolder)
        },
        include: ["__tests__", "src"],
        references: []
    };

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
