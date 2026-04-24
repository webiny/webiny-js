import { Project } from "ts-morph";
import { ParseExportsFileService } from "../../abstractions/index.js";

export class DefaultParseExportsFileService implements ParseExportsFileService.Interface {
    execute(fileContent: string, filePath?: string): ParseExportsFileService.ExportStatement[] {
        const exportStatements: ParseExportsFileService.ExportStatement[] = [];

        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile("temp.ts", fileContent);

        const exportDeclarations = sourceFile.getExportDeclarations();

        for (const exportDeclaration of exportDeclarations) {
            const moduleSpecifier = exportDeclaration.getModuleSpecifierValue();

            if (!moduleSpecifier) {
                continue;
            }

            const namedExportsNode = exportDeclaration.getNamedExports();

            // Check if it's a wildcard export (export * from "...")
            const isWildcard =
                namedExportsNode.length === 0 && exportDeclaration.isNamespaceExport();

            if (isWildcard) {
                throw new Error(`Wildcard exports are not allowed: ${filePath}`);
            }

            if (namedExportsNode.length > 0) {
                // Check if the export declaration is type-only (e.g., export type { Foo } from "...")
                const isExportTypeOnly = exportDeclaration.isTypeOnly();

                const namedExports: ParseExportsFileService.NamedExport[] = [];
                for (const namedExport of namedExportsNode) {
                    const name = namedExport.getName();
                    const aliasNode = namedExport.getAliasNode();
                    const alias = aliasNode ? aliasNode.getText() : undefined;
                    // Check if individual named export is type-only
                    const isNamedTypeOnly = namedExport.isTypeOnly();
                    namedExports.push({
                        name,
                        alias,
                        isTypeOnly: isNamedTypeOnly
                    });
                }

                const fullText = exportDeclaration.getFullText();
                const text = exportDeclaration.getText();
                const leading = fullText.substring(0, fullText.lastIndexOf(text)).trim();
                const jsdoc = leading.includes("@deprecated") ? leading : undefined;

                exportStatements.push({
                    namedExports,
                    source: moduleSpecifier,
                    isWildcard: false,
                    isTypeOnly: isExportTypeOnly,
                    jsdoc
                });
            }
        }

        return exportStatements;
    }
}

export const parseExportsFileService = ParseExportsFileService.createImplementation({
    implementation: DefaultParseExportsFileService,
    dependencies: []
});
