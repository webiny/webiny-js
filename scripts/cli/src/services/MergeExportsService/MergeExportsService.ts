import { createImplementation } from "@webiny/di";
import { MergeExportsService, ParseExportsFileService } from "../../abstractions/index.js";

type MergeExportsServiceNamespace = typeof MergeExportsService;

export class DefaultMergeExportsService implements MergeExportsServiceNamespace.Interface {
    constructor(private parseExportsFileService: ParseExportsFileService.Interface) {}

    execute(inputs: MergeExportsServiceNamespace.ExportFileInput[]): string {
        const mergedExports: Array<{
            namedExports: ParseExportsFileService.NamedExport[];
            source: string;
            isWildcard: boolean;
            isTypeOnly: boolean;
        }> = [];

        for (const input of inputs) {
            const exportStatements = this.parseExportsFileService.execute(
                input.fileContent,
                input.filePath
            );

            for (const statement of exportStatements) {
                let sourceWithPackageName = statement.source.replace(
                    /^~\//,
                    `${input.packageName}/`
                );

                // `~/index.js` means root import; strip `/index.js` to get bare package name.
                if (statement.source === "~/index.js") {
                    sourceWithPackageName = input.packageName;
                }

                mergedExports.push({
                    namedExports: statement.namedExports,
                    source: sourceWithPackageName,
                    isWildcard: statement.isWildcard,
                    isTypeOnly: statement.isTypeOnly
                });
            }
        }

        let output = "";
        for (const exportStatement of mergedExports) {
            if (exportStatement.isWildcard) {
                output += `export * from "${exportStatement.source}";\n`;
            } else {
                // If the entire export declaration is type-only, use: export type { ... } from "..."
                if (exportStatement.isTypeOnly) {
                    const namedExportsStr = exportStatement.namedExports
                        .map(exp => this.formatExportName(exp))
                        .join(", ");
                    output += `export type { ${namedExportsStr} } from "${exportStatement.source}";\n`;
                } else {
                    // Mixed exports: some might be type-only, some might not
                    // Separate into type and non-type exports
                    const typeOnlyExports = exportStatement.namedExports.filter(
                        exp => exp.isTypeOnly
                    );
                    const regularExports = exportStatement.namedExports.filter(
                        exp => !exp.isTypeOnly
                    );

                    // Generate regular exports
                    if (regularExports.length > 0) {
                        const regularExportsStr = regularExports
                            .map(exp => this.formatExportName(exp))
                            .join(", ");
                        output += `export { ${regularExportsStr} } from "${exportStatement.source}";\n`;
                    }

                    // Generate type-only exports
                    if (typeOnlyExports.length > 0) {
                        const typeOnlyExportsStr = typeOnlyExports
                            .map(exp => this.formatExportName(exp))
                            .join(", ");
                        output += `export { type ${typeOnlyExportsStr} } from "${exportStatement.source}";\n`;
                    }
                }
            }
        }

        return output;
    }

    private formatExportName(exp: ParseExportsFileService.NamedExport): string {
        if (exp.alias) {
            return `${exp.name} as ${exp.alias}`;
        }
        return exp.name;
    }
}

export const mergeExportsService = createImplementation({
    abstraction: MergeExportsService,
    implementation: DefaultMergeExportsService,
    dependencies: [ParseExportsFileService]
});
