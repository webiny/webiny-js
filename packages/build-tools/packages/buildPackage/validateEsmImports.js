import fs from "fs";
import { join } from "path";
import glob from "fast-glob";
import { Project, SyntaxKind } from "ts-morph";
import chalk from "chalk";

export const validateEsmImports = async ({ cwd }) => {
    console.log("Validating ESM imports...");

    const pattern = join(cwd, "src/**/*.{js,ts,tsx}").replace(/\\/g, "/");
    const files = glob.sync(pattern, {
        absolute: true,
        onlyFiles: true
    });

    const errors = [];
    const project = new Project({
        useInMemoryFileSystem: true,
        skipFileDependencyResolution: true
    });

    for (const filePath of files) {
        const content = await fs.promises.readFile(filePath, "utf8");
        const sourceFile = project.createSourceFile(filePath, content, { overwrite: true });

        // Get all import declarations: import { x } from 'y'
        const importDeclarations = sourceFile.getImportDeclarations();
        for (const importDecl of importDeclarations) {
            const spec = importDecl.getModuleSpecifierValue();
            await validateImportSpec(spec, filePath, errors);
        }

        // Get all export declarations: export { x } from 'y'
        const exportDeclarations = sourceFile.getExportDeclarations();
        for (const exportDecl of exportDeclarations) {
            const moduleSpecifier = exportDecl.getModuleSpecifier();
            if (moduleSpecifier) {
                const spec = moduleSpecifier.getLiteralValue();
                await validateImportSpec(spec, filePath, errors);
            }
        }

        // Get all dynamic imports: import('y')
        const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
        for (const callExpr of callExpressions) {
            const expression = callExpr.getExpression();
            if (expression.getKind() === SyntaxKind.ImportKeyword) {
                const args = callExpr.getArguments();
                if (args.length > 0 && args[0].getKind() === SyntaxKind.StringLiteral) {
                    const spec = args[0].getLiteralValue();
                    await validateImportSpec(spec, filePath, errors);
                }
            }
        }
    }

    if (errors.length > 0) {
        const invalidFiles = [...new Set(errors.map(e => e.file))];
        const errorMessage = [
            chalk.red("ESM import validation failed."),
            `Found ${errors.length} invalid import(s) in ${invalidFiles.length} file(s):`,
            "",
            ...errors.map(e => {
                const relativePath = e.file.replace(cwd, "").replace(/^[\/\\]/, "");
                return `  ${chalk.red("-")} "${chalk.red(e.spec)}" in "${chalk.red(relativePath)}"`;
            })
        ].join("\n");
        throw new Error(errorMessage);
    } else {
        console.log("All ESM imports are valid.");
    }
};

async function validateImportSpec(spec, file, errors) {
    if (spec.startsWith("~") || spec.startsWith("./") || spec.startsWith("../")) {
        // Extract the file extension from the import path
        const lastDotIndex = spec.lastIndexOf(".");
        const lastSlashIndex = Math.max(spec.lastIndexOf("/"), spec.lastIndexOf("\\"));
        const hasExtension = lastDotIndex > lastSlashIndex;

        // If there's no extension, it should have .js
        if (!hasExtension) {
            const relativePath = file.replace(process.cwd(), "").replace(/^[\/\\]/, "");
            const errorMsg = chalk.red(
                `- Missing .js extension in import "${spec}" in ${relativePath}`
            );
            console.error(errorMsg);
            errors.push({ file, spec, reason: "missing extension" });
        }
    }
}
