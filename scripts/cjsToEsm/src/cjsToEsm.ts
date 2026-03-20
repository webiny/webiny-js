import * as fs from "fs";
import * as path from "path";
import { Project, type SourceFile, StringLiteral, SyntaxKind } from "ts-morph";
import { findUpSync } from "find-up";
import pLimit from "p-limit";
import cliProgress from "cli-progress";
import { getFilesUsingGlob } from "./getFilesUsingGlob.js";
import { PackageJson } from "./PackageJson.js";
import { getPackages } from "./getPackages";

// Function to check if a path is a directory
const isDirectory = (filePath: string): boolean => {
    return fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory();
};

const extensions = [".ts", ".tsx", ".js"];

// Function to check if a path can resolve to a file.
const detectFile = (importPath: string, absolutePath: string): string | undefined => {
    if (fs.existsSync(absolutePath) && fs.lstatSync(absolutePath).isFile()) {
        return importPath;
    }

    for (const ext of extensions) {
        if (fs.existsSync(`${absolutePath}${ext}`)) {
            return `${importPath}.js`;
        }
    }

    return undefined;
};

class ImportSpecifier {
    private readonly packageName: string;
    private readonly subPath: string;

    constructor(packageName: string, subPath: string) {
        this.packageName = packageName;
        this.subPath = subPath;
    }

    static parse(specifier: string) {
        const parts = specifier.split("/");
        if (specifier.startsWith("@")) {
            const packageName = parts.slice(0, 2).join("/");
            const subPath = parts.slice(2).join("/");

            return new ImportSpecifier(packageName, subPath);
        }

        return new ImportSpecifier(parts[0], parts.slice(1).join("/"));
    }

    getPackageName() {
        return this.packageName;
    }

    getSubPath() {
        return this.subPath;
    }
}

class LocalImportPath {
    private sourceFile: SourceFile;
    private readonly sourceRoot: string;

    constructor(sourceFile: SourceFile, sourceRoot: string) {
        this.sourceFile = sourceFile;
        this.sourceRoot = sourceRoot;
    }

    resolve(importPath: string) {
        const absImportRequest = importPath.startsWith("~/")
            ? path.join(this.sourceRoot, importPath.replace("~/", ""))
            : path.resolve(path.dirname(this.sourceFile.getFilePath()), importPath);

        const detectedFile = detectFile(importPath, absImportRequest);
        if (detectedFile) {
            return detectedFile;
        }

        if (isDirectory(absImportRequest)) {
            // Ensure directory imports use "index.js"
            return !importPath.endsWith("/index.js") ? `${importPath}/index.js` : importPath;
        }

        // Ensure module imports use ".js"
        return importPath.endsWith(".js") ? importPath : `${importPath}.js`;
    }
}

class PackageImportPath {
    private sourceFile: SourceFile;
    private whitelist = ["react-virtualized", "react-transition-group"];

    constructor(sourceFile: SourceFile) {
        this.sourceFile = sourceFile;
    }

    async resolve(importPath: string) {
        const importSpecifier = ImportSpecifier.parse(importPath);
        const packageName = importSpecifier.getPackageName();
        const subPath = importSpecifier.getSubPath();

        if (
            !subPath ||
            packageName.startsWith("node:") ||
            packageName.startsWith("!!") ||
            this.whitelist.includes(packageName)
        ) {
            return importPath;
        }

        const resolvedPath = this.resolvePackagePath(importSpecifier.getPackageName());

        if (!resolvedPath) {
            throw Error(`Unable to resolve "${importPath}"!`);
        }

        const packageJson = await PackageJson.fromFile(`${resolvedPath}/package.json`);

        const exports = packageJson.getJson().exports;

        // If sub path is defined in `exports`, we leave it as-is.
        if (exports?.hasOwnProperty(`./${importSpecifier.getSubPath()}`)) {
            return importPath;
        }

        const absolutePath = `${resolvedPath}/${importSpecifier.getSubPath()}`;

        const detectedFile = detectFile(importPath, absolutePath);
        if (detectedFile) {
            return detectedFile;
        }

        if (isDirectory(absolutePath)) {
            if (importSpecifier.getSubPath() === "") {
                return importPath;
            }

            // Ensure directory imports use "index.js"
            return importPath + "/index.js";
        }

        // Ensure subpath file imports use ".js"
        return importPath + ".js";
    }

    private resolvePackagePath(packageName: string) {
        const resolvedPath = findUpSync(`node_modules/${packageName}`, {
            cwd: path.dirname(this.sourceFile.getFilePath()),
            type: "directory"
        });

        return resolvedPath;
    }
}

async function updateImports(sourceFile: SourceFile, sourceRoot: string) {
    const localPath = new LocalImportPath(sourceFile, sourceRoot);
    const packagePath = new PackageImportPath(sourceFile);

    const importDeclarations = [
        ...sourceFile.getImportDeclarations(),
        ...sourceFile.getExportDeclarations()
    ];

    for (const declaration of importDeclarations) {
        const importPath = declaration.getModuleSpecifierValue();

        if (!importPath) {
            continue;
        }

        if (importPath.endsWith(".js.js")) {
            declaration.setModuleSpecifier(importPath.replace(".js.js", ".js"));
            continue;
        }

        if (importPath.endsWith(".js")) {
            continue;
        }

        if (
            importPath.startsWith("../") ||
            importPath.startsWith("./") ||
            importPath.startsWith("~/")
        ) {
            declaration.setModuleSpecifier(localPath.resolve(importPath));
        } else {
            declaration.setModuleSpecifier(await packagePath.resolve(importPath));
        }
    }

    // Handle dynamic import(...) expressions using ts-morph
    const importCalls = sourceFile.getDescendantsOfKind(SyntaxKind.ImportKeyword);

    for (const importCall of importCalls) {
        const callExpression = importCall.getFirstAncestorByKind(SyntaxKind.CallExpression);
        if (!callExpression) {
            continue;
        }

        const [arg] = callExpression.getArguments();

        // Only handle string literals
        if (!arg || !arg.compilerNode || arg.getKind() !== SyntaxKind.StringLiteral) {
            continue;
        }

        const literalArg = arg as StringLiteral;
        const importPath = literalArg.getLiteralText();

        if (!importPath) {
            continue;
        }

        let resolvedPath: string;

        if (
            importPath.startsWith("../") ||
            importPath.startsWith("./") ||
            importPath.startsWith("~/")
        ) {
            resolvedPath = localPath.resolve(importPath);
        } else {
            resolvedPath = await packagePath.resolve(importPath);
        }

        // Replace only the string value, keeping webpack comments if any
        literalArg.replaceWithText(`"${resolvedPath}"`);
    }
}

/**
 * Main function to process all files in the root directory
 */
export async function cjsToEsm(rootDir?: string) {
    const project = new Project();

    // Get all .js, .ts, and .tsx files in the directory using glob
    const files = rootDir
        ? getFilesUsingGlob(rootDir).sort()
        : getFilesUsingGlob(await getPackages());

    const sourceFiles = project.addSourceFilesAtPaths(files);

    const progressBar = new cliProgress.SingleBar(
        {},
        {
            format: " {bar} {percentage}% | Duration: {duration_formatted} | Files: {value}/{total}",
            barCompleteChar: "\u2588",
            barIncompleteChar: "\u2591"
        }
    );
    progressBar.start(sourceFiles.length, 0);

    const limit = pLimit(4);

    const failedTransforms: Array<{ filePath: string; err: Error }> = [];

    await Promise.all(
        sourceFiles.map(sourceFile => {
            return limit(async () => {
                const filePath = sourceFile.getFilePath();

                const closestPackageJson = findUpSync("package.json", {
                    cwd: path.dirname(filePath)
                })!;

                const packageRoot = path.dirname(closestPackageJson);
                const hasSrcDir = fs.existsSync(packageRoot + "/src");
                const sourceRoot = [packageRoot, hasSrcDir ? "src" : undefined]
                    .filter(Boolean)
                    .join("/");

                try {
                    await updateImports(sourceFile, sourceRoot);
                    progressBar.increment();
                } catch (err) {
                    // Store and ignore error.
                    failedTransforms.push({ filePath, err });
                    // Revert changes.
                    await sourceFile.refreshFromFileSystem();
                }
            });
        })
    ).finally(() => {
        progressBar.stop();
    });

    if (failedTransforms.length > 0) {
        console.log("Transform encountered the following errors:");
        failedTransforms.forEach(({ filePath, err }) => {
            console.log("File: " + filePath);
            console.log(`----- ${filePath.replace(process.cwd(), "")} -----`);
            console.log(err);
            console.log("--------------------------------------\n");
        });
    }

    // Save all the changes
    project.saveSync();
}
