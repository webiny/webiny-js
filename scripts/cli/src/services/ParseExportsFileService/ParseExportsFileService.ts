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
                    // Check if individual named export is type-only
                    const isNamedTypeOnly = namedExport.isTypeOnly();
                    namedExports.push({
                        name,
                        isTypeOnly: isNamedTypeOnly
                    });
                }

                exportStatements.push({
                    namedExports,
                    source: moduleSpecifier,
                    isWildcard: false,
                    isTypeOnly: isExportTypeOnly
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
