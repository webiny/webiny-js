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
                const namedExports: string[] = [];
                for (const namedExport of namedExportsNode) {
                    const name = namedExport.getName();
                    namedExports.push(name);
                }

                exportStatements.push({
                    namedExports,
                    source: moduleSpecifier,
                    isWildcard: false
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
